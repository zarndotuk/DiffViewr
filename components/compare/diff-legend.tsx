"use client";

export function DiffLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]">
        Missing
      </span>
      <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)]">
        Extra
      </span>
      <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
        Changed
      </span>
      <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_75%,transparent)]">
        Same
      </span>
      <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--danger)_18%,transparent)]">
        Type mismatch
      </span>
    </div>
  );
}
