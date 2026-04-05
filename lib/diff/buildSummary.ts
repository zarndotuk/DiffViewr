import type { DiffNode, DiffSummary } from "@/lib/diff/types";

export function buildSummary(root: DiffNode): DiffSummary {
  const summary: DiffSummary = {
    missingInB: 0,
    extraInB: 0,
    changedValues: 0,
    typeMismatches: 0
  };

  function walk(node: DiffNode) {
    switch (node.kind) {
      case "missing":
        summary.missingInB += 1;
        break;
      case "extra":
        summary.extraInB += 1;
        break;
      case "changed":
        if (!node.children || node.children.length === 0) summary.changedValues += 1;
        break;
      case "type_mismatch":
        summary.typeMismatches += 1;
        break;
      default:
        break;
    }
    if (node.children) node.children.forEach(walk);
  }

  walk(root);
  return summary;
}
