import { isPlainObject } from "@/lib/serialize";
import type { DiffNode } from "@/lib/diff/types";
import { compareArrays } from "@/lib/diff/compareArrays";
import { compareObjects } from "@/lib/diff/compareObjects";

export function compareJson(
  a: unknown,
  b: unknown,
  path = "$",
  keyLabel = "$",
  matchFieldPath = ""
): DiffNode {
  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  const aIsObj = isPlainObject(a);
  const bIsObj = isPlainObject(b);

  if (aIsArray || bIsArray) {
    if (!aIsArray || !bIsArray) {
      return typeMismatchNode(a, b, path, keyLabel, "array");
    }
    return compareArrays(a as unknown[], b as unknown[], path, keyLabel, matchFieldPath);
  }

  if (aIsObj || bIsObj) {
    if (!aIsObj || !bIsObj) {
      return typeMismatchNode(a, b, path, keyLabel, "object");
    }
    return compareObjects(a as Record<string, unknown>, b as Record<string, unknown>, path, keyLabel, matchFieldPath);
  }

  if (a === b && typeof a === typeof b) {
    return {
      path,
      keyLabel,
      kind: "same",
      aValue: a,
      bValue: b,
      aType: typeOfValue(a),
      bType: typeOfValue(b),
      expandedByDefault: false,
      hasChanges: false,
      meta: { nodeType: "primitive" }
    };
  }

  if (typeof a !== typeof b) {
    return typeMismatchNode(a, b, path, keyLabel, "primitive");
  }

  return {
    path,
    keyLabel,
    kind: "changed",
    aValue: a,
    bValue: b,
    aType: typeOfValue(a),
    bType: typeOfValue(b),
    expandedByDefault: true,
    hasChanges: true,
    meta: { nodeType: "primitive" }
  };
}

function typeMismatchNode(a: unknown, b: unknown, path: string, keyLabel: string, nodeType: "object" | "array" | "primitive"): DiffNode {
  return {
    path,
    keyLabel,
    kind: "type_mismatch",
    aValue: a,
    bValue: b,
    aType: typeOfValue(a),
    bType: typeOfValue(b),
    expandedByDefault: true,
    hasChanges: true,
    meta: { nodeType }
  };
}

function typeOfValue(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}
