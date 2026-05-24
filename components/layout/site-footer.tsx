"use client";

const AUTHOR_URL = "https://github.com/imhassanhumayun";
const REPO_URL = "https://github.com/imhassanhumayun/DiffViewr";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-[var(--muted)] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>Free forever • Privacy-first • Static export</div>
        <div className="flex items-center gap-3">
          <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
            Hassan Humayun
          </a>
          <span aria-hidden="true">•</span>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub Repo
          </a>
        </div>
      </div>
    </footer>
  );
}

