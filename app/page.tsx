import Link from "next/link";
import { HeroSection } from "@/components/landing/hero-section";

type TrustPoint = {
  title: string;
  subLabel: string;
  icon: string;
  href?: string;
};

const trustPoints: TrustPoint[] = [
  {
    title: "100% client-side",
    subLabel: "no account, no upload",
    icon: "ti-shield-lock"
  },
  {
    title: "JSON · YAML · .ENV",
    subLabel: "format-aware compare",
    icon: "ti-file-code"
  },
  {
    title: "Template A → Target B",
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
  "System key added",
  "Microsoft.Default changed"
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

      <section className="mx-auto w-full max-w-6xl px-10 pb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px flex-1 bg-[var(--border)]"></div>
          <div className="flex items-center gap-2.5">
            <i className="ti ti-git-diff text-[15px] text-cyan-400" aria-hidden="true" />
            <span className="font-mono text-[12px] text-[var(--muted)] tracking-[0.06em]">
              47 lines of noise
            </span>
            <i className="ti ti-arrow-right text-[14px] text-[var(--muted)] opacity-40" aria-hidden="true" />
            <span className="font-mono text-[12px] text-cyan-400 tracking-[0.06em]">
              3 real changes
            </span>
          </div>
          <div className="h-px flex-1 bg-[var(--border)]"></div>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <div className="border border-[color-mix(in_srgb,var(--danger)_42%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-3 text-center font-mono text-[13px] text-[var(--danger)]">
            <div>appsettings.stg.json vs git diff</div>
            <div className="mt-2 text-[52px] font-bold leading-none">47</div>
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              lines flagged as changed
            </div>
            <div className="mt-3 grid gap-1 text-left">
              {leftImpactDetails.map((detail) => (
                <div key={detail.text} className="flex items-center gap-2 font-mono text-[11px] text-[var(--muted)]">
                  <span className={`h-px w-4 ${detail.color}`} aria-hidden="true" />
                  <span>{detail.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="font-mono text-[18px] text-[var(--muted)]" aria-hidden="true">
            <span className="sm:hidden">↓</span>
            <span className="hidden sm:inline">→</span>
          </div>
          <div className="border border-[color-mix(in_srgb,var(--ok)_42%,transparent)] bg-[color-mix(in_srgb,var(--ok)_10%,transparent)] px-5 py-3 text-center font-mono text-[13px] text-[var(--ok)]">
            <div>appsettings.stg.json in DiffViewr</div>
            <div className="mt-2 text-[52px] font-bold leading-none">3</div>
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              real value differences
            </div>
            <div className="mt-3 grid gap-1 text-left">
              {rightImpactDetails.map((detail) => (
                <div key={detail} className="flex items-center gap-2 font-mono text-[11px] text-[var(--muted)]">
                  <span className="h-px w-4 bg-[var(--ok)]" aria-hidden="true" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link href="/tool?sample=1" className="font-mono text-[12px] text-cyan-400">
            See this example in the tool →
          </Link>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-10 py-12">
        <div className="mb-7 max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[1.8px] text-cyan-400">
            Template · Target · diff
          </p>
          <h2 className="mt-3 font-sans text-[clamp(2rem,4vw,3rem)] font-normal leading-tight tracking-tight text-[var(--text)]">
            The only diff tool that treats one file as the source of truth.
          </h2>
          <p className="mt-4 max-w-2xl font-sans text-[16px] font-normal leading-relaxed tracking-normal text-[var(--muted)]">
            Most tools treat both sides equally. DiffViewr treats Template A as the reference — your target config is aligned to it, not just compared against it.
          </p>
        </div>

        <div className="grid auto-rows-[minmax(210px,auto)] gap-4 lg:grid-cols-4">
          <article className="group flex flex-col gap-4 self-start overflow-hidden rounded-lg border border-[var(--border)] bg-[#071017] p-4 text-white transition duration-300 hover:border-cyan-400/40 lg:col-span-2">
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
                <div className="flex items-center justify-center text-[18px] text-cyan-300">→</div>
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

          <article className="group rounded-lg border border-[var(--border)] bg-[#071017] p-5 text-white transition duration-300 hover:border-cyan-400/40 lg:col-span-2">
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

          <article className="group rounded-lg border border-[var(--border)] bg-[#071017] p-5 text-white transition duration-300 hover:border-cyan-400/40">
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

          <article className="group lg:col-span-3 rounded-lg border border-[var(--border)] bg-[#071017] p-5 text-white transition duration-300 hover:border-cyan-400/40">
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
              <div className="mt-4 inline-flex rounded-lg bg-cyan-400 px-4 py-2 font-mono text-[12px] font-bold text-[#0c0e11]">
                Copy Config
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-10 py-12">
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
              No paste limits · No watermarks · No account
            </p>
            <Link
              href="/tool/"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-6 py-3 font-sans text-[15px] font-medium text-[#0c0e11] transition hover:opacity-90"
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
              Try it on your config
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
