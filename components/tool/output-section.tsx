"use client";

import type { CompareResult } from "@/lib/diff/types";
import { VisualComparePanel } from "@/components/compare/visual-compare-panel";

type Props = {
  panelClass: string;
  inputClass: string;
  buttonBase: string;
  buttonPrimary: string;
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
  activeTab,
  setActiveTab,
  resultText,
  compare
}: Props) {
  const isOutputVisible = Boolean(resultText || compare);

  if (!isOutputVisible) return null;

  return (
    <section className={`${panelClass} mt-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-2">
          <button
            className={activeTab === "result" ? buttonPrimary : buttonBase}
            onClick={() => setActiveTab("result")}
            type="button"
          >
            Reordered Result
          </button>
          <button
            className={activeTab === "compare" ? buttonPrimary : buttonBase}
            onClick={() => setActiveTab("compare")}
            type="button"
          >
            Visual Compare
          </button>
        </div>
      </div>

      {activeTab === "result" ? (
        <>
          <h2 className="text-sm text-[var(--muted)] font-semibold mb-2">4) Reordered Result</h2>
          <div className="mb-2 text-[13px] text-[var(--muted)] leading-relaxed">
            This is <strong>B</strong> with only the <strong>key order</strong> adjusted to match{" "}
            <strong>A</strong> (diff-friendly). Values are unchanged.
          </div>
          <textarea
            className={`${inputClass} min-h-[60vh]`}
            value={resultText ?? ""}
            readOnly
            placeholder="Aligned output appears here."
            spellCheck={false}
          />
        </>
      ) : (
        <>
          <h2 className="text-sm text-[var(--muted)] font-semibold mb-2">4) Visual Compare</h2>
          {compare ? (
            <VisualComparePanel result={compare} />
          ) : (
            <div className="text-[13px] text-[var(--muted)]">
              Run <strong>Align & Compare</strong> to see differences.
            </div>
          )}
        </>
      )}
    </section>
  );
}
