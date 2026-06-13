import { isPlainObject } from "@/lib/serialize";
import type { DiffNode } from "@/types/diff";
import { compareJson } from "@/lib/diff/compareJson";
import { formatPrimitive, toTypedKey } from "@/lib/diff/toTypedKey";
import { getValueByPath } from "@/lib/diff/getValueByPath";

type ArrayMode = "objects" | "primitives" | "mixed";

function detectMode(arr: unknown[], matchFieldPath: string) {
  const isPrimitive = (v: unknown) =>
    v === null || ["string", "number", "boolean"].includes(typeof v);
  const allPrimitive = arr.every(isPrimitive);
  if (allPrimitive) return "primitives";
  if (matchFieldPath && arr.every((v) => isPlainObject(v))) return "objects";
  return "mixed";
}

export function compareArrays(
  a: unknown[],
  b: unknown[],
  path: string,
  keyLabel: string,
  matchFieldPath: string
): DiffNode {
  const mode: ArrayMode = detectMode(a, matchFieldPath);
  const modeB: ArrayMode = detectMode(b, matchFieldPath);
  if (mode === "primitives" && modeB === "primitives") {
    return comparePrimitiveArrays(a, b, path, keyLabel);
  }
  if (mode === "objects" && modeB === "objects") {
    return compareObjectArrays(a, b, path, keyLabel, matchFieldPath);
  }
  return compareIndexArrays(a, b, path, keyLabel, matchFieldPath);
}

function comparePrimitiveArrays(
  a: unknown[],
  b: unknown[],
  path: string,
  keyLabel: string
): DiffNode {
  const bQueues = new Map<string, number[]>();
  for (let i = 0; i < b.length; i += 1) {
    const key = toTypedKey(b[i]);
    const q = bQueues.get(key);
    if (q) q.push(i);
    else bQueues.set(key, [i]);
  }

  const used = new Set<number>();
  const children: DiffNode[] = [];
  for (let i = 0; i < a.length; i += 1) {
    const key = toTypedKey(a[i]);
    const q = bQueues.get(key);
    if (q && q.length) {
      const idx = q.shift() as number;
      used.add(idx);
      // matched primitive -> no change node
    } else {
      children.push({
        path: `${path}[${i}]`,
        keyLabel: formatPrimitive(a[i]),
        kind: "missing",
        aValue: a[i],
        aType: typeof a[i] === "object" && a[i] === null ? "null" : typeof a[i],
        expandedByDefault: true,
        hasChanges: true,
        meta: { nodeType: "primitive" }
      });
    }
  }
  for (let i = 0; i < b.length; i += 1) {
    if (used.has(i)) continue;
    children.push({
      path: `${path}[${i}]`,
      keyLabel: formatPrimitive(b[i]),
      kind: "extra",
      bValue: b[i],
      bType: typeof b[i] === "object" && b[i] === null ? "null" : typeof b[i],
      expandedByDefault: true,
      hasChanges: true,
      meta: { nodeType: "primitive" }
    });
  }

  const hasChanges = children.some((c) => c.hasChanges);
  return {
    path,
    keyLabel,
    kind: hasChanges ? "changed" : "same",
    children,
    expandedByDefault: hasChanges,
    hasChanges,
    meta: { nodeType: "array" }
  };
}

function compareObjectArrays(
  a: unknown[],
  b: unknown[],
  path: string,
  keyLabel: string,
  matchFieldPath: string
): DiffNode {
  const aItems = a as Record<string, unknown>[];
  const bItems = b as Record<string, unknown>[];
  const bMap = new Map<string, { idx: number; item: Record<string, unknown> }[]>();
  const getMatch = (item: Record<string, unknown>) => getValueByPath(item, `$.${matchFieldPath}`);
  const safeMatchLabel = (item: Record<string, unknown>) => {
    try {
      return `${matchFieldPath}=${formatPrimitive(getMatch(item))}`;
    } catch {
      return `${matchFieldPath}=<missing>`;
    }
  };

  for (let i = 0; i < bItems.length; i += 1) {
    try {
      const key = toTypedKey(getMatch(bItems[i]));
      const list = bMap.get(key);
      if (list) list.push({ idx: i, item: bItems[i] });
      else bMap.set(key, [{ idx: i, item: bItems[i] }]);
    } catch {
      bMap.set(`__unkeyed__${i}`, [{ idx: i, item: bItems[i] }]);
    }
  }

  const used = new Set<number>();
  const children: DiffNode[] = [];
  for (let i = 0; i < aItems.length; i += 1) {
    const item = aItems[i];
    let matchKey = "";
    try {
      matchKey = toTypedKey(getMatch(item));
    } catch {
      matchKey = `__unkeyed__${i}`;
    }
    const bucket = bMap.get(matchKey);
    if (!bucket || bucket.length === 0) {
      const label = safeMatchLabel(item);
      children.push({
        path: `${path}[${i}]`,
        keyLabel: label,
        kind: "missing",
        aValue: item,
        aType: "object",
        expandedByDefault: true,
        hasChanges: true,
        meta: { nodeType: "object", matchField: matchFieldPath, matchLabel: label }
      });
      continue;
    }
    const { idx, item: bItem } = bucket.shift() as { idx: number; item: Record<string, unknown> };
    used.add(idx);
    const label = safeMatchLabel(item);
    const node = compareJson(item, bItem, `${path}[${i}]`, label, matchFieldPath);
    if (node.hasChanges) children.push(node);
  }

  for (let i = 0; i < bItems.length; i += 1) {
    if (used.has(i)) continue;
    const label = safeMatchLabel(bItems[i]);
    children.push({
      path: `${path}[${i}]`,
      keyLabel: label,
      kind: "extra",
      bValue: bItems[i],
      bType: "object",
      expandedByDefault: true,
      hasChanges: true,
      meta: { nodeType: "object", matchField: matchFieldPath, matchLabel: label }
    });
  }

  const hasChanges = children.some((c) => c.hasChanges);
  return {
    path,
    keyLabel,
    kind: hasChanges ? "changed" : "same",
    children,
    expandedByDefault: hasChanges,
    hasChanges,
    meta: { nodeType: "array", matchField: matchFieldPath }
  };
}

function compareIndexArrays(
  a: unknown[],
  b: unknown[],
  path: string,
  keyLabel: string,
  matchFieldPath: string
): DiffNode {
  const maxLen = Math.max(a.length, b.length);
  const children: DiffNode[] = [];
  for (let i = 0; i < maxLen; i += 1) {
    const aVal = a[i];
    const bVal = b[i];
    if (i >= a.length) {
      children.push({
        path: `${path}[${i}]`,
        keyLabel: `[${i}]`,
        kind: "extra",
        bValue: bVal,
        bType: typeOfValue(bVal),
        expandedByDefault: true,
        hasChanges: true,
        meta: { nodeType: Array.isArray(bVal) ? "array" : isPlainObject(bVal) ? "object" : "primitive" }
      });
      continue;
    }
    if (i >= b.length) {
      children.push({
        path: `${path}[${i}]`,
        keyLabel: `[${i}]`,
        kind: "missing",
        aValue: aVal,
        aType: typeOfValue(aVal),
        expandedByDefault: true,
        hasChanges: true,
        meta: { nodeType: Array.isArray(aVal) ? "array" : isPlainObject(aVal) ? "object" : "primitive" }
      });
      continue;
    }
    const node = compareJson(aVal, bVal, `${path}[${i}]`, `[${i}]`, matchFieldPath);
    if (node.hasChanges) children.push(node);
  }
  const hasChanges = children.some((c) => c.hasChanges);
  return {
    path,
    keyLabel,
    kind: hasChanges ? "changed" : "same",
    children,
    expandedByDefault: hasChanges,
    hasChanges,
    meta: { nodeType: "array" }
  };
}

function typeOfValue(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}
