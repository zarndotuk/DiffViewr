"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const isToolPage = pathname === "/tool" || pathname === "/tool/";

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      e.preventDefault();
      window.history.pushState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[rgba(255,255,255,0.05)] bg-[#080d12]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-screen items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" onClick={handleLogoClick} className="inline-flex items-center no-underline">
            <Image
              src="/brand/diffviewr-mark.svg"
              alt="DiffViewr"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="hidden font-sans text-[16px] font-medium tracking-[-0.2px] text-[var(--text)] min-[360px]:inline">
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

        {!isToolPage ? (
          <Link
            href="/tool/"
            className="cyberpunk-button cta inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-3.5 py-2 font-sans text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] sm:px-5 sm:text-[15px]"
          >
            Compare configs
          </Link>
        ) : null}
      </div>
    </header>
  );
}
