"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

const REPO_URL = "https://github.com/imhassanhumayun/DiffViewr";

export function SiteHeader() {
  const pathname = usePathname();
  const mobileRef = useRef<HTMLDetailsElement | null>(null);

  const allMenus = useMemo(
    () => [mobileRef],
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

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      e.preventDefault();
      window.history.pushState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    <header className="sticky top-0 z-40 h-16 border-b border-[rgba(255,255,255,0.05)] bg-[#080d12]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-screen items-center justify-between gap-4 px-6 sm:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" onClick={handleLogoClick} className="inline-flex items-center gap-2 no-underline">
            <img
              src="/brand/diffviewr-mark.svg"
              alt="DiffViewr"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="font-sans text-[16px] font-medium tracking-[-0.2px] text-[var(--text)]">
              DiffViewr
            </span>
          </Link>

           <nav aria-label="Primary" className="hidden md:flex items-center gap-1 text-[14px] leading-none">
             <Link
               href="/#features"
               className="site-menu-trigger no-underline font-mono text-[13px] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
             >
               How it works
             </Link>
           </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tool/"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-sans text-[15px] font-medium text-[#0c0e11] transition hover:opacity-90"
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
            Start diffing
          </Link>
          <details
            ref={mobileRef}
            className="site-menu md:hidden"
            onToggle={() => {
              if (mobileRef.current?.open) closeOtherMenus(mobileRef);
            }}
          >
            <summary className="site-menu-trigger">Menu</summary>
            <div className="site-menu-panel" role="menu">
              <a
                className="site-menu-item"
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={closeAllMenus}
              >
                GitHub
              </a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
