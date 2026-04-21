"use client";

type Props = {
  panelClass: string;
};

export function ToolInfo({ panelClass }: Props) {
  return (
    <details className={`${panelClass} mb-4`} open={false}>
      <summary className="cursor-pointer select-none text-sm text-[var(--text)] font-semibold">
        What DiffViewr does (and doesn&apos;t do)
      </summary>
      <div className="mt-2 text-[13px] text-[var(--muted)] leading-relaxed">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Reorders <strong>B</strong> to match the <strong>key order</strong> in{" "}
            <strong>A</strong> (diff-friendly).
          </li>
          <li>Highlights additions, deletions, and changed values in Visual Compare.</li>
          <li>
            Does <strong>not</strong> merge data from A into B; B&apos;s values are preserved.
          </li>
          <li>Runs locally in your browser; no uploads.</li>
        </ul>
      </div>
    </details>
  );
}
