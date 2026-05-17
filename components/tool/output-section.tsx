"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompareResult } from "@/lib/diff/types";
import { VisualComparePanel } from "@/components/compare/visual-compare-panel";
import { shikiTokenizeLines, type ShikiTokenLine } from "@/lib/shiki/getHighlighter";

type Props = {
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
}: Props) {
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
    if (!resultText) {
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
  }, [resultText]);

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

  return (
    <section className={`${panelClass} mt-4`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            className={activeTab === "compare" ? `${buttonPrimary} active` : buttonBase}
            onClick={() => setActiveTab("compare")}
            type="button"
          >
            Visual Compare
          </button>
          <button
            className={activeTab === "result" ? `${buttonPrimary} active` : buttonBase}
            onClick={() => setActiveTab("result")}
            type="button"
          >
            Reordered Result
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className={buttonBase} onClick={onStartAgain} type="button">
            Start again
          </button>
          {hasResultText ? (
            <button className={buttonBase} onClick={onCopyResult} type="button" disabled={!canCopy}>
              Copy aligned B
            </button>
          ) : null}
        </div>
      </div>

      {activeTab === "result" ? (
        <>
          <h2 className="text-[18px] text-[var(--muted)] font-semibold mb-2">4) Reordered Result</h2>
          <div className="mb-2 text-[14px] text-[var(--muted)] leading-relaxed">
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
          <h2 className="text-[18px] text-[var(--muted)] font-semibold mb-2">4) Visual Compare</h2>
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
