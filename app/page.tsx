import Link from "next/link";
import { HeroSection } from "@/components/tool/hero-section";

type TrustPoint = {
  label: string;
  href?: string;
};

const trustPoints: TrustPoint[] = [
  { label: "100% client-side — no account, no upload" },
  { label: "JSON · YAML · .ENV" },
  { label: "Template A → Target B" },
  { label: "Source-of-truth aligned" }
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

const features = [
  {
    title: "Template-aligned comparison",
    copy: "DiffViewr aligns Target B to Template A so key order changes stop hiding the real changes."
  },
  {
    title: "Visual compare preview",
    copy: "Changed, missing, and extra values are highlighted side by side for quick review."
  },
  {
    title: "Format detection",
    copy: "Paste JSON, YAML, or ENV-style configuration and get validation feedback before comparing."
  },
  {
    title: "Export clean, reordered config",
    copy: "Generate a clean reordered result that is easier to review, commit, and share."
  }
];

export const metadata = {
  title: "DiffViewr | Config File Diff Tool for Developers",
  description:
    "Compare appsettings, YAML, and .env config files using a template-to-target model. Paste Template A, paste Target B, see only what actually changed. 100% in-browser."
};

export default function Page() {
  return (
    <main className="flex flex-col">
      <HeroSection />

      <section className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 px-10 py-8 sm:grid-cols-4">
        {trustPoints.map((point) => (
          point.href ? (
            <a
              key={point.label}
              href={point.href}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] px-4 py-3 text-center font-mono text-[12px] text-[var(--muted)] transition hover:border-cyan-400 hover:text-[var(--text)]"
            >
              {point.label}
            </a>
          ) : (
            <div
              key={point.label}
              className="border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] px-4 py-3 text-center font-mono text-[12px] text-[var(--muted)]"
            >
              {point.label}
            </div>
          )
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-10 pb-8">
        <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[1.8px] text-[var(--muted)]">
          same file · two tools
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <div className="border border-[color-mix(in_srgb,var(--danger)_42%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-3 text-center font-mono text-[13px] text-[var(--danger)]">
            <div>appsettings.stg.json vs git diff</div>
            <div className="mt-2 text-[24px] font-bold leading-none">47</div>
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              lines flagged as changed
            </div>
          </div>
          <div className="font-mono text-[18px] text-[var(--muted)]" aria-hidden="true">
            <span className="sm:hidden">↓</span>
            <span className="hidden sm:inline">→</span>
          </div>
          <div className="border border-[color-mix(in_srgb,var(--ok)_42%,transparent)] bg-[color-mix(in_srgb,var(--ok)_10%,transparent)] px-5 py-3 text-center font-mono text-[13px] text-[var(--ok)]">
            <div>appsettings.stg.json in DiffViewr</div>
            <div className="mt-2 text-[24px] font-bold leading-none">3</div>
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              real value differences
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-10 py-12">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[1.8px] text-cyan-400">
              Template · Target · diff
            </p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-[var(--text)]">
              The only diff tool that treats one file as the source of truth.
            </h2>
            <p className="mt-4 max-w-xl text-[16px] leading-7 text-[var(--muted)]">
              Most tools treat both sides equally. DiffViewr treats Template A as the reference — your target config is aligned to it, not just compared against it.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] p-5"
              >
                <h3 className="font-display text-[18px] font-semibold text-[var(--text)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-[14px] leading-6 text-[var(--muted)]">
                  {feature.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-10 py-12">
        <div className="border-y border-[var(--border)] py-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[1.8px] text-cyan-400">
                Common workflows
              </p>
              <h2 className="mt-3 font-display text-[2rem] font-bold leading-tight text-[var(--text)]">
                For the 10 minutes before every deployment.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div key={item.label} className="border border-[var(--border)] px-4 py-4 text-[15px] leading-6 text-[var(--muted)]">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.4px] text-cyan-400">
                    {item.label}
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-10 py-12 text-center">
        <h2 className="font-display text-[2rem] font-bold text-[var(--text)]">
          Just paste and compare.
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["No paste limits", "No watermarks", "No account"].map((promise) => (
            <span
              key={promise}
              className="rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] px-3 py-1 font-mono text-[12px] text-[var(--muted)]"
            >
              {promise}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-7 text-[var(--muted)]">
          DiffViewr stays out of the way so you can check a config quickly and get back to shipping.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {["JSON", "YAML", ".ENV"].map((format) => (
            <span
              key={format}
              className="rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] px-3 py-1 font-mono text-[12px] text-[var(--muted)]"
            >
              {format}
            </span>
          ))}
        </div>
        <Link
          href="/tool"
          className="mt-7 inline-flex items-center rounded-lg bg-gradient-to-r from-[#00d4aa] to-[#22d3ee] px-6 py-3 text-[15px] font-semibold text-[#06110f] shadow-[0_10px_30px_rgba(0,212,170,0.22)] transition-all hover:-translate-y-px hover:shadow-[0_14px_36px_rgba(0,212,170,0.3)] active:translate-y-0"
        >
          Start Comparing
        </Link>
      </section>
    </main>
  );
}
