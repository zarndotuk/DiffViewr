import React from "react";
import Link from "next/link";
import { DiffPreviewCard } from "@/components/landing/diff-preview-card";

export function HeroSection() {
  return (
    <section className="hero-glow relative -mx-4 sm:-mx-6 lg:-mx-10">
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

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-10 lg:pb-12 lg:pt-16">
        <div className="flex max-w-[500px] flex-col gap-5">
          <div className="inline-flex items-center gap-2 w-fit rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 font-mono text-[12px] text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Built for config reviews · not generic JSON diff
          </div>
          <h1 className="font-sans text-[clamp(2.25rem,11vw,3.6rem)] font-normal leading-[1.02] tracking-tight text-[var(--text)] lg:leading-none">
            Review config changes,
            <br />
            <em className="not-italic text-cyan-400">without the noise.</em>
          </h1>

          <p className="font-sans text-[17px] font-normal leading-relaxed tracking-normal text-[var(--muted)] max-w-[440px]">
            Paste your template as A, your environment config as B. See only what actually changed.
          </p>

          <div className="flex flex-col items-start gap-3">
            <Link
              href="/tool"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-sans text-[15px] font-medium text-[#0c0e11] transition hover:opacity-90 sm:w-auto"
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
              className="font-mono text-[12px] font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              View Live Demo →
            </Link>
          </div>

          <p className="flex items-center gap-2 font-mono text-[13px] text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-cyan-400 opacity-50 shrink-0" />
            No sign-up. No server. Runs entirely in your browser.
          </p>
        </div>

        <div className="hero-preview-stage mx-auto w-full max-w-[560px] lg:mx-0">
          <div className="hero-preview-backplate" aria-hidden="true" />
          <div className="hero-preview-float relative z-10">
            <DiffPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
