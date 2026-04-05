import { makeDiagnostics, type Diagnostics } from "@/lib/diagnostics";
import {
  formatPrimitive,
  isPlainObject,
  isPrimitive,
  serializePrimitiveKey,
  serializeValueKey,
  stableStringify,
  type Primitive
} from "@/lib/serialize";
import { getNodeByPath, parseJsonPath, type PathToken } from "@/lib/jsonPath";

export type UnmatchedHandling = "append" | "top" | "exclude";

type ArrayMode = "primitives" | "objects";

function classifyArrayMode(referenceArray: unknown[], targetArray: unknown[]): ArrayMode {
  const classify = (arr: unknown[]) => {
    if (arr.length === 0) return "empty";
    let sawPrimitive = false;
    let sawObject = false;
    for (const item of arr) {
      if (isPrimitive(item)) sawPrimitive = true;
      else if (isPlainObject(item)) sawObject = true;
      else return "other";
      if (sawPrimitive && sawObject) return "mixed";
    }
    if (sawPrimitive) return "primitives";
    if (sawObject) return "objects";
    return "other";
  };

  const a = classify(referenceArray);
  const b = classify(targetArray);

  if (a === "other" || a === "mixed") {
    throw new Error(
      "Reference array items are unsupported. Only arrays of primitives or arrays of objects can be reordered."
    );
  }
  if (b === "other" || b === "mixed") {
    throw new Error(
      "Target array items are unsupported. Only arrays of primitives or arrays of objects can be reordered."
    );
  }

  if (a === "empty") {
    if (b === "empty") return "primitives";
    return b as ArrayMode;
  }
  if (b === "empty") return a as ArrayMode;
  if (a !== b) {
    throw new Error(
      "Array item type mismatch at target path. Reference and target must both be arrays of primitives or both be arrays of objects."
    );
  }
  return a as ArrayMode;
}

function parseFieldPath(fieldPath: string): PathToken[] {
  const fp = fieldPath.trim();
  if (!fp) throw new Error("Match field path is required for arrays of objects.");
  const asJsonPath = fp.startsWith("[") || fp.startsWith(".") ? `$${fp}` : `$.${fp}`;
  return parseJsonPath(asJsonPath);
}

function readMatchValue(item: unknown, fieldTokens: PathToken[], label: string): Primitive {
  if (!isPlainObject(item)) throw new Error(`${label} item is not an object.`);
  const raw = getNodeByPath(item, fieldTokens);
  if (!isPrimitive(raw)) {
    throw new Error(
      `${label} match field must be a primitive (string/number/boolean/null). Got: ${raw === null ? "null" : typeof raw}`
    );
  }
  return raw;
}

export function reorderArrayAtPath(params: {
  referenceArray: unknown[];
  targetArray: unknown[];
  matchFieldPath: string;
  unmatchedHandling: UnmatchedHandling;
}): { reorderedNode: unknown[]; diagnostics: Diagnostics } {
  const mode = classifyArrayMode(params.referenceArray, params.targetArray);

  if (mode === "primitives") {
    const a = params.referenceArray as Primitive[];
    const b = params.targetArray as Primitive[];

    const bKeyToIndices = new Map<string, number[]>();
    for (let i = 0; i < b.length; i += 1) {
      const item = b[i];
      if (!isPrimitive(item)) throw new Error("Target array contains non-primitive items.");
      const key = serializePrimitiveKey(item);
      const queue = bKeyToIndices.get(key);
      if (queue) queue.push(i);
      else bKeyToIndices.set(key, [i]);
    }

    const used = new Array<boolean>(b.length).fill(false);
    const matchedIndices: number[] = [];
    const missingInB: string[] = [];
    for (const refItem of a) {
      if (!isPrimitive(refItem)) throw new Error("Reference array contains non-primitive items.");
      const key = serializePrimitiveKey(refItem);
      const queue = bKeyToIndices.get(key);
      if (!queue || queue.length === 0) {
        missingInB.push(formatPrimitive(refItem));
        continue;
      }
      const idx = queue.shift() as number;
      used[idx] = true;
      matchedIndices.push(idx);
    }

    const extrasIndices: number[] = [];
    for (let i = 0; i < b.length; i += 1) if (!used[i]) extrasIndices.push(i);

    const matchedItems = matchedIndices.map((i) => b[i]);
    const extraItems = extrasIndices.map((i) => b[i]);

    const extraInB = extraItems.map((v) => (isPrimitive(v) ? formatPrimitive(v) : "<invalid>"));

    const reorderedNode =
      params.unmatchedHandling === "exclude"
        ? matchedItems
        : params.unmatchedHandling === "top"
          ? extraItems.concat(matchedItems)
          : matchedItems.concat(extraItems);

    return {
      reorderedNode,
      diagnostics: makeDiagnostics({
        mode: "array-primitives",
        matchedCount: matchedItems.length,
        missingInB,
        extraInB
      })
    };
  }

  const a = params.referenceArray as Record<string, unknown>[];
  const b = params.targetArray as Record<string, unknown>[];

  if (!params.matchFieldPath.trim()) {
    const bKeyToIndices = new Map<string, number[]>();
    for (let i = 0; i < b.length; i += 1) {
      const item = b[i];
      if (!isPlainObject(item)) throw new Error("Target array contains non-object items.");
      const key = serializeValueKey(item);
      const queue = bKeyToIndices.get(key);
      if (queue) queue.push(i);
      else bKeyToIndices.set(key, [i]);
    }

    const used = new Array<boolean>(b.length).fill(false);
    const matchedIndices: number[] = [];
    const missingInB: string[] = [];

    for (let aIndex = 0; aIndex < a.length; aIndex += 1) {
      const item = a[aIndex];
      if (!isPlainObject(item)) throw new Error("Reference array contains non-object items.");
      const key = serializeValueKey(item);
      const queue = bKeyToIndices.get(key);
      if (!queue || queue.length === 0) {
        missingInB.push(stableStringify(item));
        continue;
      }
      const idx = queue.shift() as number;
      used[idx] = true;
      matchedIndices.push(idx);
    }

    const extrasIndices: number[] = [];
    for (let i = 0; i < b.length; i += 1) if (!used[i]) extrasIndices.push(i);

    const matchedItems = matchedIndices.map((i) => b[i]);
    const extraItems = extrasIndices.map((i) => b[i]);
    const extraInB = extrasIndices.map((i) => stableStringify(b[i]));

    const reorderedNode =
      params.unmatchedHandling === "exclude"
        ? matchedItems
        : params.unmatchedHandling === "top"
          ? extraItems.concat(matchedItems)
          : matchedItems.concat(extraItems);

    return {
      reorderedNode,
      diagnostics: makeDiagnostics({
        mode: "array-objects",
        matchedCount: matchedItems.length,
        missingInB,
        extraInB
      })
    };
  }

  const fieldTokens = parseFieldPath(params.matchFieldPath);

  const bKeyToIndices = new Map<string, number[]>();
  const bIndexToDisplayKey: string[] = new Array<string>(b.length).fill("");
  const unkeyedExtras: number[] = [];

  for (let i = 0; i < b.length; i += 1) {
    const item = b[i];
    if (!isPlainObject(item)) throw new Error("Target array contains non-object items.");
    try {
      const matchVal = readMatchValue(item, fieldTokens, "Target (B)");
      const key = serializePrimitiveKey(matchVal);
      bIndexToDisplayKey[i] = formatPrimitive(matchVal);
      const queue = bKeyToIndices.get(key);
      if (queue) queue.push(i);
      else bKeyToIndices.set(key, [i]);
    } catch {
      bIndexToDisplayKey[i] = `<unkeyed @${i}>`;
      unkeyedExtras.push(i);
    }
  }

  const used = new Array<boolean>(b.length).fill(false);
  const matchedIndices: number[] = [];
  const missingInB: string[] = [];

  for (let aIndex = 0; aIndex < a.length; aIndex += 1) {
    const item = a[aIndex];
    if (!isPlainObject(item)) throw new Error("Reference array contains non-object items.");
    const matchVal = readMatchValue(item, fieldTokens, "Reference (A)");
    const key = serializePrimitiveKey(matchVal);
    const queue = bKeyToIndices.get(key);
    if (!queue || queue.length === 0) {
      missingInB.push(formatPrimitive(matchVal));
      continue;
    }
    const idx = queue.shift() as number;
    used[idx] = true;
    matchedIndices.push(idx);
  }

  const extrasIndices: number[] = [];
  for (let i = 0; i < b.length; i += 1) if (!used[i]) extrasIndices.push(i);

  const matchedItems = matchedIndices.map((i) => b[i]);
  const extraItems = extrasIndices.map((i) => b[i]);
  const extraInB = extrasIndices.map((i) => bIndexToDisplayKey[i] || `<unmatched @${i}>`);

  const reorderedNode =
    params.unmatchedHandling === "exclude"
      ? matchedItems
      : params.unmatchedHandling === "top"
        ? extraItems.concat(matchedItems)
        : matchedItems.concat(extraItems);

  // Keep the "unkeyed" items visible in diagnostics even if they were matched by chance (they won't be).
  void unkeyedExtras;

  return {
    reorderedNode,
    diagnostics: makeDiagnostics({
      mode: "array-objects",
      matchedCount: matchedItems.length,
      missingInB,
      extraInB
    })
  };
}
