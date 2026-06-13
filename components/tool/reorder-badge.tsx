"use client";

export function ReorderBadge() {
  const tooltip =
    "B's keys have been reordered to follow A's structure.\nValues are unchanged.";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-2 py-1 text-xs text-[color-mix(in_srgb,var(--accent)_70%,var(--text))]">
      B reordered by A&apos;s key sequence
      <span
        title={tooltip}
        aria-label={tooltip}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[12px] leading-none"
      >
        ⓘ
      </span>
    </span>
  );
}

