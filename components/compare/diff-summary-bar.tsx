"use client";

import type { DiffSummary } from "@/types/diff";
import { ReorderBadge } from "@/components/tool/reorder-badge";

type FilterKind = "missing" | "extra" | "changed" | "type_mismatch";

type SummaryStat = {
  kind: FilterKind;
  label: string;
  count: number;
  color: string;
};

type DiffSummaryBarProps = {
  summary: DiffSummary;
  activeFilters: Set<FilterKind>;
  onToggleFilter: (kind: FilterKind) => void;

};

export function DiffSummaryBar({
  summary,
  activeFilters,
  onToggleFilter
}: DiffSummaryBarProps) {
  const allStats: SummaryStat[] = [
    { kind: "missing", label: "Missing in B", count: summary.missingInB, color: "#e24b4a" },
    { kind: "extra", label: "Extra in B", count: summary.extraInB, color: "#1d9e75" },
    { kind: "changed", label: "Changed", count: summary.changedValues, color: "#f59e0b" },
    { kind: "type_mismatch", label: "Type mismatch", count: summary.typeMismatches, color: "#a78bfa" }
  ];
  const stats = allStats.filter((stat) => stat.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-3 py-3 sm:gap-4">
      <ReorderBadge />
      {stats.length ? <div className="h-3 w-px bg-[var(--border)]" /> : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {stats.map((stat) => {
          const isActive = activeFilters.has(stat.kind);
          return (
            <button
              key={stat.kind}
              type="button"
              className={`inline-flex min-h-9 items-center gap-2 font-mono text-[11px] transition-colors sm:text-[12px] ${
                isActive ? "text-[var(--text)]" : "text-[var(--muted)]"
              }`}
              onClick={() => onToggleFilter(stat.kind)}
              aria-pressed={isActive}
            >
              <span
                className={`h-2 w-2 rounded-full ${isActive ? "opacity-100" : "opacity-30"}`}
                style={{ backgroundColor: stat.color }}
                aria-hidden="true"
              />
              <span>
                {stat.label}: <strong>{stat.count}</strong>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
