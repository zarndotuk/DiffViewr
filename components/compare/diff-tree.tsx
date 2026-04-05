"use client";

import type { DiffNode } from "@/lib/diff/types";
import { DiffNodeRow } from "@/components/compare/diff-node-row";

export function DiffTree({
  root,
  showUnchanged,
  differencesOnly,
  expanded,
  onToggle
}: {
  root: DiffNode;
  showUnchanged: boolean;
  differencesOnly: boolean;
  expanded: Set<string>;
  onToggle: (path: string) => void;
}) {
  function shouldRender(node: DiffNode) {
    if (node.path === "$") return true;
    if (differencesOnly) return node.hasChanges;
    if (showUnchanged) return true;
    return node.hasChanges;
  }

  function renderNode(node: DiffNode, depth: number) {
    if (!shouldRender(node)) return null;
    const isExpanded = expanded.has(node.path);
    return (
      <div key={node.path}>
        <DiffNodeRow
          node={node}
          depth={depth}
          expanded={isExpanded}
          onToggle={node.children?.length ? () => onToggle(node.path) : undefined}
        />
        {node.children && node.children.length && isExpanded
          ? node.children.map((child) => renderNode(child, depth + 1))
          : null}
      </div>
    );
  }

  return <div className="w-full">{renderNode(root, 0)}</div>;
}
