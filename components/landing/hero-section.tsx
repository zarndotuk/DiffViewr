import React from "react";
import Link from "next/link";
import { DiffPreviewCard } from "@/components/landing/diff-preview-card";

export function HeroSection() {
  return (
    <section className="hero-glow relative -mx-4 overflow-hidden sm:-mx-6 lg:-mx-10">
      <picture className="hero-art-bg absolute inset-0">
        <source
          media="(max-width: 767px)"
          type="image/avif"
          srcSet="/hero-technical-bg-960.avif"
        />
        <source
          media="(max-width: 767px)"
          type="image/webp"
          srcSet="/hero-technical-bg-960.webp"
        />
        <source type="image/avif" srcSet="/hero-technical-bg-1823.avif" />
        <source type="image/webp" srcSet="/hero-technical-bg-1823.webp" />
        <img
          src="/hero-technical-bg-1823.jpg"
          alt=""
          width={1823}
          height={863}
          decoding="async"
          fetchPriority="high"
        />
      </picture>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl min-w-0 grid-cols-1 items-center gap-6 px-4 pb-6 pt-6 sm:gap-10 sm:px-6 sm:pb-12 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-10 lg:pt-16">
        <div className="flex min-w-0 max-w-[500px] flex-col gap-4 sm:gap-5">
          <div className="inline-flex max-w-full items-center gap-2 self-start rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 font-mono text-[10px] leading-4 text-cyan-400 min-[390px]:text-[11px] sm:text-[12px]">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cyan-400" />
            <span className="truncate">Built for config reviews, not generic JSON diff</span>
          </div>

          <h1 className="font-sans text-[clamp(2.1rem,10.5vw,3.6rem)] font-normal leading-[1.02] tracking-tight text-[var(--text)] lg:leading-none">
            Review config changes,
            <br />
            <em className="not-italic text-cyan-400">without the noise.</em>
          </h1>

          <p className="max-w-[440px] font-sans text-[15px] font-normal leading-relaxed tracking-normal text-[var(--muted)] sm:text-[17px]">
            Paste your template as A, your environment config as B. See only what actually changed.
          </p>

          <div className="flex flex-col items-stretch gap-3 min-[390px]:flex-row min-[390px]:items-center">
            <Link
              href="/tool"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-sans text-[15px] font-medium text-[#0c0e11] transition hover:opacity-90 min-[390px]:w-auto"
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
              Open the tool
            </Link>
            <Link
              href="/tool?sample=1"
              className="inline-flex min-h-11 items-center justify-center px-2 font-mono text-[12px] font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              View live demo
            </Link>
          </div>

          <p className="hidden items-center gap-2 font-mono text-[13px] text-[var(--muted)] sm:flex">
            <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 opacity-50" />
            No sign-up. No server. Runs entirely in your browser.
          </p>
        </div>

        <div
          className="w-full overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] shadow-[0_20px_55px_rgba(0,8,13,0.36)] sm:hidden"
          role="img"
          aria-label="DiffViewr workflow: paste Template A, paste Target B, then review only the real changes"
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-[var(--border)] px-3 py-3 font-mono">
            <div className="min-w-0">
              <span className="block text-[9px] uppercase tracking-[0.12em] text-cyan-400">Template A</span>
              <span className="mt-1 block truncate text-[11px] text-[var(--text)]">source of truth</span>
            </div>
            <span className="text-[13px] text-[var(--muted)]" aria-hidden="true">+</span>
            <div className="min-w-0 text-right">
              <span className="block text-[9px] uppercase tracking-[0.12em] text-cyan-400">Target B</span>
              <span className="mt-1 block truncate text-[11px] text-[var(--text)]">environment config</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 font-mono text-[13px] text-cyan-300">
              A:B
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[13px] font-medium text-[var(--text)]">Key order aligned automatically</p>
              <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">Reordering noise removed before comparison</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_58%,transparent)] px-3 py-3">
            <div>
              <span className="block font-sans text-[15px] font-medium text-[var(--text)]">3 real changes</span>
              <span className="font-mono text-[10px] text-[var(--muted)]">ready to review</span>
            </div>
            <div className="flex gap-2 font-mono text-[10px]">
              <span className="rounded-md bg-amber-400/10 px-2 py-1 text-amber-300">2 changed</span>
              <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-emerald-300">1 added</span>
            </div>
          </div>
        </div>

        <div className="hero-preview-stage mx-auto hidden w-full min-w-0 max-w-[560px] sm:block lg:mx-0">
          <div className="hero-preview-backplate" aria-hidden="true" />
          <div className="hero-preview-float relative z-10">
            <DiffPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
