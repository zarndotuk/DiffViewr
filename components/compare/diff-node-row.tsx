"use client";

import type { DiffNode } from "@/lib/diff/types";
import { DiffValueCell } from "@/components/compare/diff-value-cell";

function formatValue(value: unknown) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return "[...]";
  if (typeof value === "object") return "{...}";
  return String(value);
}

export function DiffNodeRow({
  node,
  depth,
  expanded,
  onToggle
}: {
  node: DiffNode;
  depth: number;
  expanded: boolean;
  onToggle?: () => void;
}) {
  const hasChildren = Boolean(node.children && node.children.length);
  const rowTint =
    node.kind === "missing"
      ? "bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
      : node.kind === "extra"
        ? "bg-[color-mix(in_srgb,var(--ok)_10%,transparent)]"
        : node.kind === "changed"
          ? "bg-[color-mix(in_srgb,var(--warn)_10%,transparent)]"
          : node.kind === "type_mismatch"
            ? "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)]"
            : "";
  const badge =
    node.kind === "missing"
      ? "Missing"
      : node.kind === "extra"
        ? "Extra"
        : node.kind === "changed"
          ? "Changed"
          : node.kind === "type_mismatch"
            ? "Type mismatch"
            : "Same";

  const aText =
    node.kind === "type_mismatch"
      ? `${node.aType ?? "unknown"}: ${node.aValue !== undefined ? formatValue(node.aValue) : "(missing)"}`
      : node.aValue !== undefined
        ? formatValue(node.aValue)
        : "(missing)";
  const bText =
    node.kind === "type_mismatch"
      ? `${node.bType ?? "unknown"}: ${node.bValue !== undefined ? formatValue(node.bValue) : "(missing)"}`
      : node.bValue !== undefined
        ? formatValue(node.bValue)
        : "(missing)";

  return (
    <div
      className={`grid grid-cols-[minmax(180px,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-[color-mix(in_srgb,var(--border)_55%,transparent)] py-2 px-3 ${rowTint}`}
    >
      <div className="flex items-start gap-2 min-w-0">
        <div style={{ width: depth * 12 }} />
        {hasChildren ? (
          <button
            className="text-xs px-1 rounded border border-[var(--border)] hover:border-[var(--accent)]"
            onClick={onToggle}
            type="button"
          >
            {expanded ? "-" : "+"}
          </button>
        ) : (
          <span className="text-xs text-[var(--muted)]">•</span>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--text)] break-words">
            {node.keyLabel}
          </div>
          <span className="text-[12px] uppercase tracking-wide text-[var(--muted)]">
            {badge}
          </span>
        </div>
      </div>
      <div className="min-w-0 border-l border-[color-mix(in_srgb,var(--border)_55%,transparent)] pl-3">
        <DiffValueCell
          value={aText}
          kind={node.kind === "extra" ? "extra" : node.kind}
          label="A"
        />
      </div>
      <div className="min-w-0 border-l border-[color-mix(in_srgb,var(--border)_55%,transparent)] pl-3">
        <DiffValueCell
          value={bText}
          kind={node.kind === "missing" ? "missing" : node.kind}
          label="B"
        />
      </div>
    </div>
  );
}
