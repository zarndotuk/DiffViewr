"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { CompareResult } from "@/types/diff";
import type { ShikiLang, ShikiTokenLine } from "@/lib/shiki/getHighlighter";
import type { SupportedFormat } from "@/lib/validateInput";

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
  resultFormat: SupportedFormat;
  compare: CompareResult | null;
  showFeedbackPrompt?: boolean;
  rating: number;
  onRate: (value: number) => void;
  onDismissFeedback: () => void;
  onSubmitFeedback: () => void;
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
  resultFormat,
  compare,
  showFeedbackPrompt,
  rating,
  onRate,
  onDismissFeedback,
  onSubmitFeedback
}: OutputSectionProps) {
  const isOutputVisible = Boolean(resultText || compare);
  const hasResultText = Boolean(resultText?.length);

  const [tokens, setTokens] = useState<ShikiTokenLine[] | null>(null);

  useEffect(() => {
    if (activeTab !== "result" || !resultText) {
      setTokens(null);
      return;
    }

    let active = true;
    const lineCount = resultText.split("\n").length;
    if (lineCount > 3000 || resultText.length > 300_000) return;

    const lang: ShikiLang =
      resultFormat === "yaml"
        ? "yaml"
        : resultFormat === "env"
          ? "dotenv"
          : "json";

    void import("@/lib/shiki/getHighlighter")
      .then(({ shikiTokenizeLines }) =>
        shikiTokenizeLines({ code: resultText, lang })
      )
      .then((lines) => {
        if (active) setTokens(lines);
      })
      .catch(() => {
        // Plain text remains available when highlighting fails.
      });

    return () => {
      active = false;
    };
  }, [activeTab, resultFormat, resultText]);

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

  const containerStyles = {
    backgroundColor: "var(--panel)",
    color: "var(--text)"
  };

  if (!isOutputVisible) return null;

  const tabBase =
    "px-3 py-2 border-b-2 border-transparent font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
  const activeTabClass = `${tabBase} border-cyan-400 text-[var(--text)]`;
  const inactiveTabClass = `${tabBase} text-[var(--muted)] hover:text-[var(--text)]`;
  const ghostActionClass =
    "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent font-sans text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
  const primaryActionClass =
    "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent font-sans text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section className={`${panelClass} mt-2 sm:mt-4`}>
      <div className="mb-3 flex flex-col gap-3 border-b border-[var(--border)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
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
        <div className="grid grid-cols-2 items-center gap-2 pb-3 sm:flex sm:pb-2">
          <button className={ghostActionClass} onClick={onStartAgain} type="button">
            <svg
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 3-6.7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4v5h5" />
            </svg>
            Start again
          </button>
          {hasResultText ? (
            <button className={primaryActionClass} onClick={onCopyResult} type="button" disabled={!canCopy}>
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
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
              <div className="json-view overflow-x-auto border border-[var(--border)] font-mono text-[13px] leading-relaxed p-3 rounded-xl sm:text-[14px]"
               style={containerStyles}>
             {resultText ? resultText.split('\n').map((line, i) => (
               <div key={i} className="json-editor-line">
                 <span className="json-lineno" aria-hidden="true" style={{ color: containerStyles.color, opacity: "0.85" }}>
                   {i + 1}
                 </span>
                 {renderTokenLine(tokens?.[i], line)}
               </div>
             )) : (
              <span className="text-[var(--muted)]" style={{ color: containerStyles.color, opacity: "0.85" }}>
                Aligned output appears here.
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          {compare ? (
            <>
              <VisualComparePanel result={compare} />
              {showFeedbackPrompt ? (
                <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-sans text-[14px] font-medium text-[var(--text)]">
                      How was the visual compare?
                    </div>
                    <p className="mt-1 font-sans text-[13px] text-[var(--muted)]">
                      A quick rating helps improve the compare view.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`h-8 w-8 rounded-full text-[20px] leading-none transition-colors ${
                            rating >= star
                              ? "text-[var(--accent)]"
                              : "text-[var(--muted)] hover:text-[var(--text)]"
                          }`}
                          role="radio"
                          aria-checked={rating === star}
                          aria-label={`${star} star${star === 1 ? "" : "s"}`}
                          onClick={() => onRate(star)}
                        >
                          &#9733;
                        </button>
                      ))}
                    </div>
                    <button className={ghostActionClass} type="button" onClick={onDismissFeedback}>
                      Not now
                    </button>
                    <button
                      className={buttonPrimary}
                      type="button"
                      onClick={onSubmitFeedback}
                      disabled={rating === 0}
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : null}
            </>
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
