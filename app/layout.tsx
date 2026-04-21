import type { ReactNode } from "react";
import { Space_Grotesk, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const monoFont = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata = {
  title: "DiffViewr",
  description:
    "Align config key order in B to match A (diff-friendly ordering).",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.svg", type: "image/svg+xml", sizes: "32x32" },
      { url: "/favicon-16.svg", type: "image/svg+xml", sizes: "16x16" }
    ]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var p=localStorage.getItem('theme');p=(p==='light'||p==='dark'||p==='system')?p:'dark';var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');var r=(p==='system')?(m&&m.matches?'dark':'light'):p;var d=document.documentElement;d.setAttribute('data-theme',r);d.setAttribute('data-theme-pref',p);d.style.colorScheme=r;if(p==='system'&&m){var f=function(){var rr=m.matches?'dark':'light';d.setAttribute('data-theme',rr);d.style.colorScheme=rr;};if(m.addEventListener)m.addEventListener('change',f);else if(m.addListener)m.addListener(f);}}catch(e){}})();"
          }}
        />
      </head>
      <body className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
        <SiteHeader />
        <div className="relative isolate overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] right-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-indigo-600/15 rounded-full blur-[100px] animate-float" />
            <div className="absolute bottom-[10%] left-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-violet-900/15 rounded-full blur-[100px] animate-float [animation-delay:1.5s]" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-screen px-10">
            {children}
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
