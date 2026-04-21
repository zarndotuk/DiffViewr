"use client";

import type { DiffSummary } from "@/lib/diff/types";
import { ReorderBadge } from "@/components/ReorderBadge";

export function DiffSummaryBar({ summary }: { summary: DiffSummary }) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-2 bg-[color-mix(in_srgb,var(--panel)_85%,transparent)] p-2 rounded-xl border border-[var(--border)]">
      <ReorderBadge />
      <span className="text-xs px-2 py-1 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_70%,transparent)]">
        Missing in B: <strong>{summary.missingInB}</strong>
      </span>
      <span className="text-xs px-2 py-1 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_70%,transparent)]">
        Extra in B: <strong>{summary.extraInB}</strong>
      </span>
      <span className="text-xs px-2 py-1 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_70%,transparent)]">
        Changed: <strong>{summary.changedValues}</strong>
      </span>
      <span className="text-xs px-2 py-1 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_70%,transparent)]">
        Type mismatch: <strong>{summary.typeMismatches}</strong>
      </span>
    </div>
  );
}
