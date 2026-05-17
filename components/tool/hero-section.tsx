import React from "react";
import Link from "next/link";
import { DiffPreviewCard } from "@/components/tool/diff-preview-card";

export function HeroSection() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-10 pt-16 pb-10 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
      <div className="flex flex-col gap-5">
        <div className="inline-flex items-center gap-2 w-fit rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 font-mono text-[12px] text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Built for config reviews · not generic JSON diff
        </div>
        <a
          href="https://github.com/imhassanhumayun/DiffViewr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 w-fit rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 font-mono text-[12px] text-cyan-400 transition hover:border-cyan-400/50 hover:bg-cyan-400/15"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="currentColor"
          >
            <path d="M8 0C3.58 0 0 3.67 0 8.2c0 3.62 2.29 6.69 5.47 7.78.4.08.55-.18.55-.4 0-.2-.01-.86-.01-1.56-2.01.38-2.53-.5-2.69-.96-.09-.24-.48-.96-.82-1.15-.28-.15-.68-.53-.01-.54.63-.01 1.08.59 1.23.84.72 1.24 1.87.89 2.33.68.07-.53.28-.89.51-1.1-1.78-.21-3.64-.91-3.64-4.05 0-.89.31-1.63.82-2.2-.08-.21-.36-1.04.08-2.17 0 0 .67-.22 2.2.84A7.4 7.4 0 0 1 8 3.94c.68 0 1.36.09 2 .27 1.53-1.06 2.2-.84 2.2-.84.44 1.13.16 1.96.08 2.17.51.57.82 1.3.82 2.2 0 3.15-1.87 3.84-3.65 4.05.29.25.54.75.54 1.52 0 1.1-.01 1.98-.01 2.25 0 .22.15.48.55.4A8.12 8.12 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z" />
          </svg>
          Open source on GitHub
        </a>

        <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.025em] text-[var(--text)]">
          Review config changes,
          <br />
          <em className="not-italic text-cyan-400">without the noise.</em>
        </h1>

        <p className="font-sans text-[17px] leading-[1.7] text-[var(--muted)] max-w-[440px] tracking-[-0.005em]">
          Paste your template as A, your environment config as B. See only what actually changed.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/tool"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00d4aa] to-[#22d3ee] px-5 py-3 text-[15px] font-semibold text-[#06110f] shadow-[0_10px_30px_rgba(0,212,170,0.22)] transition-all hover:-translate-y-px hover:shadow-[0_14px_36px_rgba(0,212,170,0.3)] active:translate-y-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Open DiffViewr
          </Link>
          <Link
            href="/tool?sample=1"
            className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] px-5 py-3 text-[15px] font-semibold text-[var(--text)] transition-all hover:-translate-y-px hover:border-[#00d4aa] hover:bg-[color-mix(in_srgb,var(--panel)_65%,#00d4aa_8%)] active:translate-y-0"
          >
            Try Example
          </Link>
        </div>

        <p className="flex items-center gap-2 font-mono text-[13px] text-[var(--muted)]">
          <span className="h-2 w-2 rounded-full bg-cyan-400 opacity-50 shrink-0" />
          No sign-up. No server. Runs entirely in your browser.
        </p>
      </div>

      <DiffPreviewCard />
    </section>
  );
}
