"use client";

import type { ValidationResult } from "@/lib/validateInput";

type Props = {
  result: ValidationResult;
  onJumpToLine: (lineNumber: number) => void;
};

export function ValidationStatus({ result, onJumpToLine }: Props) {
  if (result.valid) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] px-2 py-0.5 text-[12px] font-medium text-[color-mix(in_srgb,var(--ok)_65%,var(--text))]">
        <span aria-hidden="true">✓</span> valid {String(result.format).toLowerCase()}
      </span>
    );
  }

  const line = result.line;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-2 py-0.5 text-[12px] font-medium text-[color-mix(in_srgb,var(--danger)_65%,var(--text))]">
      <span aria-hidden="true">✗</span>
      <span className="min-w-0 truncate">{result.error}</span>
      {typeof line === "number" ? (
        <>
          <span aria-hidden="true">—</span>
          <button
            type="button"
            className="underline underline-offset-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            onClick={() => onJumpToLine(line)}
            aria-label={`Jump to line ${line}`}
          >
            line {line}
          </button>
        </>
      ) : null}
    </span>
  );
}
