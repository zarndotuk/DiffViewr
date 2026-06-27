import Link from "next/link";
import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { CompareByFormat } from "@/components/landing/compare-by-format";

type TrustPoint = {
  title: string;
  subLabel: string;
  icon: string;
  href?: string;
};

const trustPoints: TrustPoint[] = [
  {
    title: "100% client-side",
    subLabel: "no signup, no upload",
    icon: "ti-shield-lock"
  },
  {
    title: "JSON / YAML / .ENV",
    subLabel: "format-aware compare",
    icon: "ti-file-code"
  },
  {
    title: "Template A to Target B",
    subLabel: "source-of-truth flow",
    icon: "ti-arrow-right"
  },
  {
    title: "GitHub-ready",
    subLabel: "cleaner PR diffs",
    icon: "ti-brand-github"
  }
];

const leftImpactDetails = [
  {
    text: "44 are just key reordering",
    color: "bg-[var(--danger)]"
  },
  {
    text: "3 are real value changes",
    color: "bg-[var(--ok)]"
  }
];

const rightImpactDetails = [
  "Serilog.Default changed",
  "Serilog.Override.System changed",
  "Api.TimeoutSeconds changed"
];

const useCases = [
  {
    label: "pre-release",
    text: "Compare appsettings files before a release"
  },
  {
    label: "env drift",
    text: "Review staging vs production config"
  },
  {
    label: "pull request",
    text: "Normalize noisy JSON diffs in PRs"
  },
  {
    label: "deployment",
    text: "Spot meaningful environment changes"
  }
];

const homepageDescription =
  "Compare appsettings, YAML, and .env config files using a template-to-target model. Paste Template A, paste Target B, see only what actually changed. 100% in-browser.";
const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DiffViewr",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  url: "https://www.diffviewr.com/",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  featureList: [
    "JSON configuration comparison",
    "YAML configuration comparison",
    ".env configuration comparison",
    "Template A to Target B key-order alignment",
    "Duplicate key validation",
    "Client-side processing"
  ]
};

export const metadata: Metadata = {
  title: {
    absolute: "DiffViewr | Config File Diff Tool for Developers"
  },
  description: homepageDescription,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "DiffViewr | Config File Diff Tool for Developers",
    description: homepageDescription,
    url: "/",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DiffViewr | Config File Diff Tool for Developers",
    description: homepageDescription
  }
};

export default function Page() {
  return (
    <main className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationJsonLd)
        }}
      />
      <HeroSection />

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 px-0 py-6 min-[430px]:grid-cols-2 sm:py-8 lg:grid-cols-4 lg:px-10">
        {trustPoints.map((point) => (
          point.href ? (
            <a
              key={point.title}
              href={point.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] px-4 py-3 text-left font-mono text-[12px] text-[var(--muted)] transition hover:border-cyan-400/40 hover:text-[var(--text)]"
            >
              <i className={`ti ${point.icon} mt-0.5 text-[18px] text-cyan-400`} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-bold leading-5 text-[var(--text)]">{point.title}</span>
                <span className="block leading-5 text-[var(--muted)]">{point.subLabel}</span>
              </span>
            </a>
          ) : (
            <div
              key={point.title}
              className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] px-4 py-3 text-left font-mono text-[12px] text-[var(--muted)]"
            >
              <i className={`ti ${point.icon} mt-0.5 text-[18px] text-cyan-400`} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-bold leading-5 text-[var(--text)]">{point.title}</span>
                <span className="block leading-5 text-[var(--muted)]">{point.subLabel}</span>
              </span>
            </div>
          )
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-0 pb-8 lg:px-10">
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_76%,transparent)]">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-400">
                <i className="ti ti-filter-code" aria-hidden="true" />
                Signal extraction
              </div>
              <h2 className="mt-2 font-sans text-[clamp(1.4rem,3vw,2rem)] font-normal leading-tight tracking-tight text-[var(--text)]">
                Review the change, not the churn.
              </h2>
            </div>
            <div className="flex items-baseline gap-2 font-mono sm:text-right">
              <span className="text-[30px] font-bold leading-none text-cyan-400">94%</span>
              <span className="max-w-24 text-[11px] leading-4 text-[var(--muted)]">
                less noise to inspect
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_136px_1fr]">
            <article className="relative px-5 py-6 sm:px-7 sm:py-7">
              <div className="mb-6 flex items-center justify-between gap-4 font-mono text-[11px]">
                <span className="uppercase tracking-[0.12em] text-[var(--danger)]">Standard git diff</span>
                <span className="truncate text-[var(--muted)]">appsettings.stg.json</span>
              </div>

              <div className="flex items-end gap-4">
                <div className="font-mono text-[clamp(4.5rem,12vw,7rem)] font-bold leading-[0.75] tracking-[-0.08em] text-[var(--danger)]">
                  47
                </div>
                <div className="pb-1 font-mono text-[11px] leading-4 text-[var(--muted)]">
                  lines flagged
                  <br />
                  as changed
                </div>
              </div>

              <div className="mt-7 grid gap-2">
                {leftImpactDetails.map((detail) => (
                  <div
                    key={detail.text}
                    className="flex items-center gap-3 border-l border-[color-mix(in_srgb,var(--danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] px-3 py-2 font-mono text-[11px] text-[var(--muted)]"
                  >
                    <span className={`h-1.5 w-1.5 ${detail.color}`} aria-hidden="true" />
                    <span>{detail.text}</span>
                  </div>
                ))}
              </div>
            </article>

            <div className="relative flex min-h-24 items-center justify-center border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_52%,transparent)] lg:min-h-0 lg:border-x lg:border-y-0">
              <div className="absolute left-6 right-6 top-1/2 h-px bg-[var(--border)] lg:bottom-7 lg:left-1/2 lg:right-auto lg:top-7 lg:h-auto lg:w-px" />
              <div className="relative flex items-center gap-3 rounded-full border border-cyan-400/30 bg-[var(--bg)] px-4 py-2 font-mono text-[11px] text-cyan-400 shadow-[0_0_28px_rgba(34,211,238,0.12)] lg:flex-col lg:gap-1.5 lg:px-3">
                <i className="ti ti-adjustments-horizontal text-[17px]" aria-hidden="true" />
                <span>normalize</span>
                <i className="ti ti-arrow-right text-[14px] lg:rotate-90" aria-hidden="true" />
              </div>
            </div>

            <article className="relative bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ok)_8%,transparent),transparent_58%)] px-5 py-6 sm:px-7 sm:py-7">
              <div className="mb-6 flex items-center justify-between gap-4 font-mono text-[11px]">
                <span className="uppercase tracking-[0.12em] text-[var(--ok)]">DiffViewr result</span>
                <span className="flex items-center gap-1.5 text-[var(--ok)]">
                  <i className="ti ti-circle-check-filled" aria-hidden="true" />
                  review ready
                </span>
              </div>

              <div className="flex items-end gap-4">
                <div className="font-mono text-[clamp(4.5rem,12vw,7rem)] font-bold leading-[0.75] tracking-[-0.08em] text-[var(--ok)]">
                  3
                </div>
                <div className="pb-1 font-mono text-[11px] leading-4 text-[var(--muted)]">
                  real value
                  <br />
                  differences
                </div>
              </div>

              <div className="mt-7 grid gap-2">
                {rightImpactDetails.map((detail) => (
                  <div
                    key={detail}
                    className="flex items-center gap-3 border-l border-[color-mix(in_srgb,var(--ok)_42%,transparent)] bg-[color-mix(in_srgb,var(--ok)_7%,transparent)] px-3 py-2 font-mono text-[11px] text-[var(--text)]"
                  >
                    <i className="ti ti-check text-[13px] text-[var(--ok)]" aria-hidden="true" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="flex justify-center border-t border-[var(--border)] px-5 py-4">
            <Link
              href="/tool?sample=1"
              className="inline-flex min-h-11 items-center justify-center gap-2 font-mono text-[12px] text-cyan-400 transition hover:text-cyan-300"
            >
              See this example in the tool
              <i className="ti ti-arrow-right text-[14px]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <CompareByFormat />

      <section id="features" className="feature-stage relative -mx-4 overflow-hidden border-y border-[var(--border)] sm:-mx-6 lg:-mx-10">
        <div className="feature-stage-grid absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <div className="mb-9 max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[1.8px] text-cyan-400">
            Template / Target / diff
          </p>
          <h2 className="mt-3 font-sans text-[clamp(2rem,4vw,3rem)] font-normal leading-tight tracking-tight text-[var(--text)]">
            The only diff tool that treats one file as the source of truth.
          </h2>
          <p className="mt-4 max-w-2xl font-sans text-[16px] font-normal leading-relaxed tracking-normal text-[var(--muted)]">
            Most tools treat both sides equally. DiffViewr treats Template A as the reference, so your target config is aligned to it before comparison.
          </p>
        </div>

        <div className="grid auto-rows-[minmax(210px,auto)] gap-4 lg:grid-cols-4">
          <article className="feature-stage-card group flex flex-col gap-4 self-start overflow-hidden rounded-lg border border-[var(--border)] p-4 text-white transition duration-300 hover:border-cyan-400/40 lg:col-span-2">
            <h3 className="font-sans text-[15px] font-medium leading-snug tracking-[-0.01em] text-white">
              Template-aligned comparison
            </h3>
            <p className="max-w-xl font-sans text-[14px] font-normal leading-relaxed tracking-normal text-slate-300">
              Reorder Target B against Template A first, then review the differences that still matter.
            </p>
            <div className="mt-4 grid gap-3 rounded-lg border border-cyan-400/20 bg-black/35 p-3 font-mono text-[10px] leading-5 text-slate-100 sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded border border-white/10 bg-[#0b1620] p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-[1.4px] text-cyan-300">template.yml</div>
                  <div className="text-slate-400">logging:</div>
                  <div className="pl-3 text-white">level: info</div>
                  <div className="pl-3 text-white">path: /var/log</div>
                  <div className="text-slate-400">system:</div>
                  <div className="pl-3 text-white">region: eu</div>
                </div>
                <div className="flex items-center justify-center text-[18px] text-cyan-300">to</div>
                <div className="rounded border border-cyan-400/25 bg-[#0d1b24] p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-[1.4px] text-cyan-300">target reordered</div>
                  <div className="text-slate-400">logging:</div>
                  <div className="pl-3 text-white">level: debug</div>
                  <div className="pl-3 text-white">path: /var/log</div>
                  <div className="text-slate-400">system:</div>
                  <div className="pl-3 text-emerald-300">region: eu</div>
                </div>
              </div>
          </article>

          <article className="feature-stage-card group rounded-lg border border-[var(--border)] p-5 text-white transition duration-300 hover:border-cyan-400/40 lg:col-span-2">
            <h3 className="font-sans text-[15px] font-medium leading-snug tracking-[-0.01em] text-white">
              Visual compare preview
            </h3>
            <p className="mt-2 font-sans text-[14px] font-normal leading-relaxed tracking-normal text-slate-300">
              Changed, missing, and extra values stay readable in a fast side-by-side pass.
            </p>
            <div className="mt-4 grid gap-3 font-mono text-[11px] leading-5 sm:grid-cols-2">
              <div className="rounded border border-red-400/25 bg-red-950/20 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-[1.4px] text-red-300">missing</div>
                <div className="bg-red-400/15 px-2 py-1 text-red-200">- Serilog.Default: Warning</div>
                <div className="px-2 py-1 text-slate-300">  Microsoft.Default: Info</div>
              </div>
              <div className="rounded border border-emerald-400/25 bg-emerald-950/20 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-[1.4px] text-emerald-300">added</div>
                <div className="bg-emerald-400/15 px-2 py-1 text-emerald-200">+ System: Enabled</div>
                <div className="px-2 py-1 text-slate-300">  Microsoft.Default: Debug</div>
              </div>
            </div>
          </article>

          <article className="feature-stage-card group rounded-lg border border-[var(--border)] p-5 text-white transition duration-300 hover:border-cyan-400/40">
            <h3 className="font-sans text-[15px] font-medium leading-snug tracking-[-0.01em] text-white">
              Format detection
            </h3>
            <p className="mt-2 font-sans text-[13px] font-normal leading-relaxed tracking-normal text-slate-300">
              Paste config and get validation feedback before comparing.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 font-mono text-[12px] font-semibold">
              {["JSON", "YAML", ".ENV"].map((format) => (
                <span key={format} className="rounded border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-cyan-200">
                  {format}
                </span>
              ))}
            </div>
          </article>

          <article className="feature-stage-card group rounded-lg border border-[var(--border)] p-5 text-white transition duration-300 hover:border-cyan-400/40 lg:col-span-3">
            <h3 className="font-sans text-[15px] font-medium leading-snug tracking-[-0.01em] text-white">
              Export clean, reordered config
            </h3>
            <p className="mt-2 font-sans text-[13px] font-normal leading-relaxed tracking-normal text-slate-300">
              Generate a clean result that is easier to review, commit, and share.
            </p>
            <div className="mt-5 rounded-lg border border-white/10 bg-black/35 p-3">
              <div className="mb-3 h-2 w-20 rounded-full bg-slate-700" />
              <div className="mb-2 h-2 w-full rounded-full bg-slate-800" />
              <div className="h-2 w-2/3 rounded-full bg-slate-800" />
              <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[11px] font-medium text-slate-200">
                <i className="ti ti-copy text-[14px] text-cyan-300" aria-hidden="true" />
                Copy Config
              </div>
            </div>
          </article>
        </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-0 py-10 sm:py-12 lg:px-10">
        <div className="border-t border-[var(--border)] py-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[1.8px] text-cyan-400">
                Common workflows
              </p>
              <h2 className="mt-3 font-sans text-[2rem] font-normal leading-tight tracking-tight text-[var(--text)]">
                For the 10 minutes before every deployment.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div key={item.label} className="border border-[var(--border)] px-4 py-4 font-sans text-[15px] font-normal leading-relaxed tracking-normal text-[var(--muted)]">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.4px] text-cyan-400">
                    {item.label}
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <p className="font-mono text-[13px] text-[var(--muted)]">
              No paste limits / No watermarks / No signup
            </p>
            <Link
              href="/tool/"
              className="cyberpunk-button cta inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-sans text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-px sm:w-auto"
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
              Open Tool
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
