const REPO_URL = "https://github.com/zarn-uk/DiffViewr";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <div>Free forever - Privacy-first - Static export</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px]">
          <span className="text-[color-mix(in_srgb,var(--muted)_72%,transparent)]">
            Built with{" "}
            <a
              className="text-[var(--muted)] transition-colors hover:text-[var(--text)]"
              href="https://nextjs.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js
            </a>
            {" + "}
            <a
              className="text-[var(--muted)] transition-colors hover:text-[var(--text)]"
              href="https://posthog.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              PostHog
            </a>
          </span>
          <span className="text-[var(--border)]" aria-hidden="true">
            /
          </span>
          <a
            className="text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Repo
          </a>
        </div>
      </div>
    </footer>
  );
}
