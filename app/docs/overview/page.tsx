"use client";

import Link from "next/link";

export default function DocsOverviewPage() {
  return (
    <main className="py-10">
      <div className="max-w-3xl">
        <h1 className="font-sans text-2xl font-normal leading-tight tracking-tight">Docs: Overview</h1>
        <p className="mt-3 font-sans text-[16px] font-normal leading-relaxed tracking-normal text-[var(--muted)]">
          DiffViewr is a privacy-first diff helper for config-like text. Paste a Reference (A)
          and Target (B), then reorder B to match A’s ordering for cleaner diffs.
        </p>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <h2 className="font-sans text-sm font-normal leading-tight tracking-tight text-[var(--text)]">Quick start</h2>
          <ol className="mt-2 list-decimal pl-5 text-[14px] text-[var(--muted)] space-y-1">
            <li>Paste Template (A) on the left.</li>
            <li>Paste Config (B) on the right.</li>
            <li>Click “Align & Compare”.</li>
            <li>Copy the reordered result and commit a diff-friendly change.</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] font-sans text-sm font-medium hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            Back to tool
          </Link>
          <a
            href="https://github.com/codebyzarnuk/DiffViewr"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] font-sans text-sm font-medium hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            View repo
          </a>
        </div>
      </div>
    </main>
  );
}
