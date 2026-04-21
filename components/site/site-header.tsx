"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ThemeSelector } from "./theme-selector";

const AUTHOR_URL = "https://github.com/imhassanhumayun";
const REPO_URL = "https://github.com/imhassanhumayun/DiffViewr";

export function SiteHeader() {
  const aboutRef = useRef<HTMLDetailsElement | null>(null);
  const docsRef = useRef<HTMLDetailsElement | null>(null);
  const mobileRef = useRef<HTMLDetailsElement | null>(null);

  const allMenus = useMemo(
    () => [aboutRef, docsRef, mobileRef],
    []
  );

  function closeAllMenus() {
    for (const ref of allMenus) {
      if (ref.current) ref.current.open = false;
    }
  }

  function closeOtherMenus(except: { current: HTMLDetailsElement | null }) {
    for (const ref of allMenus) {
      if (ref === except) continue;
      if (ref.current) ref.current.open = false;
    }
  }

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const insideAny = allMenus.some((ref) => ref.current?.contains(target));
      if (!insideAny) closeAllMenus();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllMenus();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [allMenus]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_86%,transparent)] backdrop-blur">
      <div className="mx-auto w-full max-w-screen px-10 py-1.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 no-underline">
            <img
              src="/brand/diffviewr-mark.svg"
              alt="DiffViewr"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="font-display text-[15px] font-semibold tracking-[-0.2px] text-[var(--text)]">
              DiffViewr
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-1 text-[13px] leading-none">
          <details
            ref={aboutRef}
            className="site-menu"
            onToggle={() => {
              if (aboutRef.current?.open) closeOtherMenus(aboutRef);
            }}
          >
            <summary className="site-menu-trigger">About</summary>
            <div className="site-menu-panel" role="menu">
              <a
                className="site-menu-item"
                href={AUTHOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={closeAllMenus}
              >
                Author
              </a>
              <a
                className="site-menu-item"
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={closeAllMenus}
              >
                Repo
              </a>
            </div>
          </details>

          <details
            ref={docsRef}
            className="site-menu"
            onToggle={() => {
              if (docsRef.current?.open) closeOtherMenus(docsRef);
            }}
          >
            <summary className="site-menu-trigger">Docs</summary>
            <div className="site-menu-panel" role="menu">
              <Link
                className="site-menu-item"
                href="/docs/overview"
                role="menuitem"
                onClick={closeAllMenus}
              >
                Overview
              </Link>
            </div>
          </details>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <details
            ref={mobileRef}
            className="site-menu md:hidden"
            onToggle={() => {
              if (mobileRef.current?.open) closeOtherMenus(mobileRef);
            }}
          >
            <summary className="site-menu-trigger">Menu</summary>
            <div className="site-menu-panel" role="menu">
              <div className="px-2 py-1 text-[11px] uppercase tracking-[1.8px] text-[var(--muted)]">
                About
              </div>
              <a
                className="site-menu-item"
                href={AUTHOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={closeAllMenus}
              >
                Author
              </a>
              <a
                className="site-menu-item"
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={closeAllMenus}
              >
                Repo
              </a>
              <div className="mt-1 px-2 py-1 text-[11px] uppercase tracking-[1.8px] text-[var(--muted)]">
                Docs
              </div>
              <Link
                className="site-menu-item"
                href="/docs/overview"
                role="menuitem"
                onClick={closeAllMenus}
              >
                Overview
              </Link>
            </div>
          </details>
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
}
