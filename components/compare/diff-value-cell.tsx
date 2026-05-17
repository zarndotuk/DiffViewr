"use client";

import type { DiffKind } from "@/lib/diff/types";

export function DiffValueCell({
  value,
  kind,
  label
}: {
  value: string;
  kind: DiffKind;
  label?: string;
}) {
  const base =
    "px-2 py-1 rounded-md border text-xs font-mono break-words";
  const color =
    kind === "missing"
      ? "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] border-[color-mix(in_srgb,var(--danger)_45%,transparent)]"
      : kind === "extra"
        ? "bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] border-[color-mix(in_srgb,var(--ok)_45%,transparent)]"
      : kind === "changed"
          ? "bg-[color-mix(in_srgb,var(--warn)_12%,transparent)] border-[color-mix(in_srgb,var(--warn)_45%,transparent)]"
          : kind === "type_mismatch"
            ? "bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] border-[color-mix(in_srgb,var(--danger)_55%,transparent)]"
            : "bg-[color-mix(in_srgb,var(--panel)_75%,transparent)] border-[var(--border)]";

  return (
    <div className={`${base} ${color}`}>
      {label ? <span className="mr-2 text-[12px] uppercase text-[var(--muted)]">{label}</span> : null}
      {value}
    </div>
  );
}
