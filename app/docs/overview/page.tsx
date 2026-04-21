"use client";

import Link from "next/link";

export default function DocsOverviewPage() {
  return (
    <main className="py-10">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Docs: Overview</h1>
        <p className="mt-3 text-[15px] text-[var(--muted)] leading-relaxed">
          DiffViewr is a privacy-first diff helper for config-like text. Paste a Reference (A)
          and Target (B), then reorder B to match A’s ordering for cleaner diffs.
        </p>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[linear-gradient(180deg,var(--panel),var(--panel2))] p-4 shadow-[var(--shadow)]">
          <h2 className="text-sm font-semibold text-[var(--text)]">Quick start</h2>
          <ol className="mt-2 list-decimal pl-5 text-[13px] text-[var(--muted)] space-y-1">
            <li>Paste Template (A) on the left.</li>
            <li>Paste Config (B) on the right.</li>
            <li>Click “Align & Compare”.</li>
            <li>Copy the reordered result and commit a diff-friendly change.</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] text-sm hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            Back to tool
          </Link>
          <a
            href="https://github.com/imhassanhumayun/DiffViewr"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] text-sm hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            View repo
          </a>
        </div>
      </div>
    </main>
  );
}
