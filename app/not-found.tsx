import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-[12px] uppercase tracking-[1.8px] text-cyan-400">
        404
      </p>
      <h1 className="mt-3 font-sans text-[clamp(2rem,4vw,3rem)] font-normal leading-tight tracking-tight text-[var(--text)]">
        Page not found.
      </h1>
      <p className="mt-4 font-sans text-[16px] font-normal leading-relaxed tracking-normal text-[var(--muted)]">
        The page you are looking for is not available.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex w-fit items-center rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] px-3 py-2 font-sans text-sm font-medium text-[var(--text)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      >
        Back home
      </Link>
    </main>
  );
}
