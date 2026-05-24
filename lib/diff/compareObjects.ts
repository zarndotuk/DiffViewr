import { isPlainObject } from "@/lib/serialize";
import type { DiffNode } from "@/types/diff";
import { compareJson } from "@/lib/diff/compareJson";

export function compareObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  path: string,
  keyLabel: string,
  matchFieldPath: string
): DiffNode {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  const children: DiffNode[] = [];

  for (const key of keys) {
    const nextPath = path === "$" ? `$.${key}` : `${path}.${key}`;
    const aVal = a[key];
    const bVal = b[key];
    if (!(key in b)) {
      children.push({
        path: nextPath,
        keyLabel: key,
        kind: "missing",
        aValue: aVal,
        aType: typeOfValue(aVal),
        bType: typeOfValue(bVal),
        expandedByDefault: true,
        hasChanges: true,
        meta: { nodeType: isPlainObject(aVal) ? "object" : Array.isArray(aVal) ? "array" : "primitive" }
      });
      continue;
    }
    if (!(key in a)) {
      children.push({
        path: nextPath,
        keyLabel: key,
        kind: "extra",
        bValue: bVal,
        aType: typeOfValue(aVal),
        bType: typeOfValue(bVal),
        expandedByDefault: true,
        hasChanges: true,
        meta: { nodeType: isPlainObject(bVal) ? "object" : Array.isArray(bVal) ? "array" : "primitive" }
      });
      continue;
    }
    const node = compareJson(aVal, bVal, nextPath, key, matchFieldPath);
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
    meta: { nodeType: "object" }
  };
}

function typeOfValue(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}
