import { makeDiagnostics, type Diagnostics } from "@/lib/diagnostics";

export function reorderObjectKeysAtPath(params: {
  referenceObject: Record<string, unknown>;
  targetObject: Record<string, unknown>;
}): { reorderedNode: Record<string, unknown>; diagnostics: Diagnostics } {
  const aKeys = Object.keys(params.referenceObject);
  const bKeys = Object.keys(params.targetObject);

  const reordered: Record<string, unknown> = {};
  const missingInB: string[] = [];
  const included = new Set<string>();

  for (const k of aKeys) {
    if (Object.prototype.hasOwnProperty.call(params.targetObject, k)) {
      reordered[k] = params.targetObject[k];
      included.add(k);
    } else {
      missingInB.push(k);
    }
  }

  const extraInB: string[] = [];
  for (const k of bKeys) {
    if (included.has(k)) continue;
    reordered[k] = params.targetObject[k];
    extraInB.push(k);
  }

  return {
    reorderedNode: reordered,
    diagnostics: makeDiagnostics({
      mode: "object-keys",
      matchedCount: included.size,
      missingInB,
      extraInB
    })
  };
}
