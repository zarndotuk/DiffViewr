"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { CompareResult } from "@/types/diff";
import { shikiTokenizeLines, type ShikiTokenLine } from "@/lib/shiki/getHighlighter";

type VisualComparePanelProps = {
  result: CompareResult;
};

const VisualComparePanel = dynamic<VisualComparePanelProps>(
  () =>
    import("@/components/compare/visual-compare-panel").then(
      (mod) => mod.VisualComparePanel
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-xl border border-[var(--border)] p-4 text-[14px] text-[var(--muted)]"
        role="status"
        aria-live="polite"
      >
        Loading visual compare...
      </div>
    )
  }
);

export type OutputSectionProps = {
  panelClass: string;
  inputClass: string;
  buttonBase: string;
  buttonPrimary: string;
  canCopy: boolean;
  onCopyResult: () => void;
  onStartAgain: () => void;
  activeTab: "result" | "compare";
  setActiveTab: (tab: "result" | "compare") => void;
  resultText: string | null;
  compare: CompareResult | null;
};

export function OutputSection({
  panelClass,
  inputClass,
  buttonBase,
  buttonPrimary,
  canCopy,
  onCopyResult,
  onStartAgain,
  activeTab,
  setActiveTab,
  resultText,
  compare
}: OutputSectionProps) {
  const isOutputVisible = Boolean(resultText || compare);
  const hasResultText = Boolean(resultText?.length);

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const read = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setResolvedTheme(t === "light" ? "light" : "dark");
    };

    read();
    const mo = new MutationObserver(() => read());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  const [tokens, setTokens] = useState<ShikiTokenLine[] | null>(null);

  useEffect(() => {
    if (activeTab !== "result" || !resultText) {
      setTokens(null);
      return;
    }

    let active = true;

    shikiTokenizeLines({ code: resultText, theme: 'dark-plus' }).then((lines) => {
      if (active) setTokens(lines);
    });

    return () => {
      active = false;
    };
  }, [activeTab, resultText]);

  function renderTokenLine(tokens: ShikiTokenLine | undefined, fallbackText: string) {
    if (!tokens) return <span className="json-code whitespace-pre">{fallbackText}</span>;
    return (
      <span className="json-code">
        {tokens.map((t, i) => (
          <span key={i} style={t.color ? { color: t.color } : undefined}>
            {t.content}
          </span>
        ))}
      </span>
    );
  }

  // Calculate dynamic min-height based on JSON content length
  const getDynamicMinHeight = useMemo(() => {
    if (!resultText) return '400px'; // Default minimum height

    const lines = resultText.split('\n').length;
    const lineHeight = 22; // Approximate pixels per line (accounting for line-height)
    const calculatedMinHeight = Math.max(400, lines * lineHeight); // Min 400px, no max constraint

    return `${calculatedMinHeight}px`;
  }, [resultText]);

  // Determine background and text colors based on app theme
  const getContainerStyles = () => {
    if (resolvedTheme === "dark") {
      // In dark app theme, use dark background for result view
      return {
        backgroundColor: "var(--panel)",
        color: "var(--text)"
      };
    } else {
      // In light app theme, use dark background for result view to show dark-plus colors
      return {
        backgroundColor: "#1e1e1e",
        color: "#f8f8f2"
      };
    }
  };

  if (!isOutputVisible) return null;

  const tabBase =
    "px-3 py-2 border-b-2 border-transparent font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
  const activeTabClass = `${tabBase} border-cyan-400 text-[var(--text)]`;
  const inactiveTabClass = `${tabBase} text-[var(--muted)] hover:text-[var(--text)]`;
  const ghostActionClass =
    "px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent font-sans text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
  const primaryActionClass =
    "px-3 py-2 rounded-lg border border-transparent bg-cyan-400 font-sans text-sm font-medium text-[#0c0e11] transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section className={`${panelClass} mt-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)]">
        <div className="flex flex-wrap gap-1">
          <button
            className={activeTab === "compare" ? activeTabClass : inactiveTabClass}
            onClick={() => setActiveTab("compare")}
            type="button"
          >
            Visual Compare
          </button>
          <button
            className={activeTab === "result" ? activeTabClass : inactiveTabClass}
            onClick={() => setActiveTab("result")}
            type="button"
          >
            Reordered Result
          </button>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <button className={ghostActionClass} onClick={onStartAgain} type="button">
            Start again
          </button>
          {hasResultText ? (
            <button className={primaryActionClass} onClick={onCopyResult} type="button" disabled={!canCopy}>
              Copy aligned B
            </button>
          ) : null}
        </div>
      </div>

      {activeTab === "result" ? (
        <>
          <h2 className="mb-2 font-sans text-[18px] font-normal leading-tight tracking-tight text-[var(--muted)]">4) Reordered Result</h2>
          <div className="mb-2 font-sans text-[14px] font-normal leading-relaxed tracking-normal text-[var(--muted)]">
            This is <strong>B</strong> with only the <strong>key order</strong> adjusted to match{" "}
            <strong>A</strong> (diff-friendly). Values are unchanged.
          </div>
<div className="json-view border border-[var(--border)] font-mono text-[14px] leading-relaxed p-3 rounded-xl"
               style={getContainerStyles()}>
             {resultText ? resultText.split('\n').map((line, i) => (
               <div key={i} className="json-editor-line">
                 <span className="json-lineno" aria-hidden="true" style={{ color: getContainerStyles().color, opacity: "0.85" }}>
                   {i + 1}
                 </span>
                 {renderTokenLine(tokens?.[i], line)}
               </div>
             )) : (
              <span className="text-[var(--muted)]" style={{ color: getContainerStyles().color, opacity: "0.85" }}>
                Aligned output appears here.
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          {compare ? (
            <VisualComparePanel result={compare} />
          ) : (
            <div className="text-[14px] text-[var(--muted)]">
              Run <strong>Align & Compare</strong> to see differences.
            </div>
          )}
        </>
      )}
    </section>
  );
}
