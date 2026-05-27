const REPO_URL = "https://github.com/imhassanhumayun/DiffViewr";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <div>Free forever - Privacy-first - Static export</div>
        <div className="flex items-center gap-3">
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub Repo
          </a>
        </div>
      </div>
    </footer>
  );
}
