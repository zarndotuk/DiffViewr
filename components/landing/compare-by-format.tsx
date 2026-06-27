import Link from "next/link";
import { formatLandingOrder, formatLandingPages } from "@/lib/formatLandingContent";

export function CompareByFormat() {
  return (
    <section className="mx-auto w-full max-w-6xl px-0 py-10 sm:py-12 lg:px-10">
      <div className="border-y border-[var(--border)] py-10">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[1.8px] text-cyan-400">
              Three formats. One format-aware diff.
            </p>
            <h2 className="mt-3 font-sans text-[2rem] font-normal leading-tight tracking-tight text-[var(--text)]">
              Land on the comparer that matches your file.
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {formatLandingOrder.map((key) => {
            const page = formatLandingPages[key];

            return (
              <Link
                key={page.route}
                href={page.route}
                className="group flex min-h-40 flex-col justify-between rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] p-4 text-left transition hover:border-cyan-400/45 hover:bg-[color-mix(in_srgb,var(--panel)_86%,transparent)]"
              >
                <span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-400">
                    {page.formatLabel}
                  </span>
                  <span className="mt-3 block font-sans text-[20px] font-normal text-[var(--text)]">
                    {page.title}
                  </span>
                  <span className="mt-2 block font-sans text-[14px] leading-6 text-[var(--muted)]">
                    {page.description}
                  </span>
                </span>
                <span className="mt-5 inline-flex items-center gap-2 font-mono text-[12px] text-cyan-400">
                  Try it now
                  <i className="ti ti-arrow-right text-[14px] transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
