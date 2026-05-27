"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { detectIndentFromText, stringifyLikeInput } from "@/lib/stringifyLikeInput";
import { compareJson } from "@/lib/diff/compareJson";
import { buildSummary } from "@/lib/diff/buildSummary";
import type { CompareResult } from "@/types/diff";
import { JsonInputGrid } from "@/components/tool/json-input-grid";
import type { OutputSectionProps } from "@/components/tool/output-section";
import { detectFormat } from "@/lib/detectFormat";
import { validateInput, type ValidationResult } from "@/lib/validateInput";
import { reorderByTemplate } from "@/lib/reorderByTemplate";
import { useReorderArrays } from "@/hooks/use-reorder-arrays";
import { flags } from "@/lib/flags";

type SortResult = {
  resultText: string;
};

const OutputSection = dynamic<OutputSectionProps>(
  () => import("@/components/tool/output-section").then((mod) => mod.OutputSection),
  {
    ssr: false,
    loading: () => (
      <section
        className="mt-4 p-8 text-[14px] text-[var(--muted)]"
        role="status"
        aria-live="polite"
      >
        Preparing results...
      </section>
    )
  }
);

/** Isolates `useSearchParams()` inside a `<Suspense>` boundary so Next.js can
 *  statically generate the `/tool` page without a CSR bail-out.
 *  The inner effect reads the `sample` query param exactly once and triggers
 *  `onLoadSample` — matching the original component's behaviour. */
function SearchParamsInit({
  onLoadSample,
  children,
}: {
  onLoadSample: () => void;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const sampleLoadedRef = useRef(false);

  useEffect(() => {
    if (sampleLoadedRef.current || searchParams.get("sample") !== "1") return;
    sampleLoadedRef.current = true;
    onLoadSample();
  }, [onLoadSample, searchParams]);

  return <>{children}</>;
}

export default function Page() {
  const [refText, setRefText] = useState<string>("");
  const [targetText, setTargetText] = useState<string>("");
  const { reorderArrays, toggleReorderArrays } = useReorderArrays();

  const [viewMode, setViewMode] = useState<"editing" | "results">("editing");
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<SortResult | null>(null);
  const [compare, setCompare] = useState<CompareResult | null>(null);
  const [activeTab, setActiveTab] = useState<"result" | "compare">("compare");
  const [inputsCollapsed, setInputsCollapsed] = useState<boolean>(false);
  const [validationA, setValidationA] = useState<ValidationResult | null>(null);
  const [validationB, setValidationB] = useState<ValidationResult | null>(null);
  const refImmediateValidateNext = useRef(false);
  const targetImmediateValidateNext = useRef(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const resultSectionRef = useRef<HTMLElement | null>(null);
  const isOutputVisible = Boolean(result || compare);
  const bothHaveContent = Boolean(refText.trim() && targetText.trim());
  const isResultsOnly = viewMode === "results" && isOutputVisible;

  const canCopy = useMemo(
    () => Boolean(result?.resultText?.length),
    [result?.resultText]
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const cookie = document.cookie
      .split("; ")
      .find(
        (row) =>
          row.startsWith("diffviewr_rating=") ||
          row.startsWith("json_tool_rating=")
      );
    if (cookie) setHasRated(true);
  }, []);

  useEffect(() => {
    if (!isOutputVisible) setInputsCollapsed(false);
  }, [isOutputVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && bothHaveContent) {
        sortAndCompare({ reorderArrays });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothHaveContent, reorderArrays]);

  useEffect(() => {
    const trimmed = refText.trim();
    if (!trimmed) {
      setValidationA(null);
      return;
    }

    const validate = () => {
      const format = detectFormat(refText);
      setValidationA(validateInput(refText, format));
    };

    if (refImmediateValidateNext.current) {
      refImmediateValidateNext.current = false;
      validate();
      return;
    }

    const t = setTimeout(validate, 600);
    return () => clearTimeout(t);
  }, [refText]);

  useEffect(() => {
    const trimmed = targetText.trim();
    if (!trimmed) {
      setValidationB(null);
      return;
    }

    const validate = () => {
      const format = detectFormat(targetText);
      setValidationB(validateInput(targetText, format));
    };

    if (targetImmediateValidateNext.current) {
      targetImmediateValidateNext.current = false;
      validate();
      return;
    }

    const t = setTimeout(validate, 600);
    return () => clearTimeout(t);
  }, [targetText]);

  function setRatingCookie(value: number) {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `diffviewr_rating=${value}; max-age=${maxAge}; path=/; samesite=lax`;
  }

  function clearMessages() {
    setError("");
    setStatus("");
  }



  function startAgain() {
    clearMessages();
    setRefText("");
    setTargetText("");
    setResult(null);
    setCompare(null);
    setValidationA(null);
    setValidationB(null);
    setInputsCollapsed(false);
    setActiveTab("compare");
    setShowFeedbackPrompt(false);
    setRating(0);
    setViewMode("editing");
    requestAnimationFrame(() => {
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(() => {
        const el = document.getElementById("reference-json") as HTMLTextAreaElement | null;
        el?.focus();
      });
    });
  }

  async function copyResult() {
    clearMessages();
    if (!result?.resultText) return;
    try {
      await navigator.clipboard.writeText(result.resultText);
      setStatus("Copied result to clipboard.");
    } catch {
      setError("Clipboard copy failed. Your browser may block clipboard access.");
    }
  }

  const onLoadSample = useCallback(() => {
    clearMessages();
    setRefText(JSON.stringify(SAMPLE.reference, null, 2));
    setTargetText(JSON.stringify(SAMPLE.target, null, 2));
    setResult(null);
    setCompare(null);
    setInputsCollapsed(false);
    setValidationA(null);
    setValidationB(null);
    setViewMode("editing");

    // Scroll to tool input after a brief delay to allow state updates
    setTimeout(() => {
      const element = document.getElementById("tool-input");
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  function sortAndCompare(options?: { reorderArrays?: boolean }) {
    const effectiveReorderArrays = options?.reorderArrays ?? reorderArrays;

    clearMessages();
    setResult(null);
    setCompare(null);
    setViewMode("editing");

    const formatA = detectFormat(refText);
    const formatB = detectFormat(targetText);

    const aValidation = validateInput(refText, formatA);
    const bValidation = validateInput(targetText, formatB);
    setValidationA(aValidation);
    setValidationB(bValidation);

    if (!aValidation.valid) {
      setError(`Fix Reference (A) (${formatA.toUpperCase()}) to continue.`);
      return;
    }
    if (!bValidation.valid) {
      setError(`Fix Target (B) (${formatB.toUpperCase()}) to continue.`);
      return;
    }

    // The tool works with plain JS values; validation normalizes inputs into objects.
    const refJson: unknown = aValidation.parsed;
    const targetJson: unknown = bValidation.parsed;

    try {
      const nextRoot = reorderByTemplate(
        targetJson as Record<string, unknown>,
        refJson as Record<string, unknown>,
        effectiveReorderArrays
      );
      const resultText = stringifyLikeInput(nextRoot, targetText);
      const indentA = detectIndentFromText(refText) ?? 2;
      const indentB = detectIndentFromText(targetText) ?? 2;
      setResult({ resultText });
      setStatus(effectiveReorderArrays ? "Reordered B (keys + arrays)." : "Reordered B (keys).");
      const root = compareJson(refJson, nextRoot, "$", "$", "");
      setCompare({
        root,
        summary: buildSummary(root),
        aRoot: refJson,
        bRoot: nextRoot,
        aIndent: indentA,
        bIndent: indentB
      });
      setActiveTab("compare");
      setInputsCollapsed(true);
      setViewMode("results");
      requestAnimationFrame(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      setShowFeedbackPrompt(!hasRated);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

const SAMPLE = {
  path: "$.items",
  matchField: "id",
  reference: {
    items: [
      { id: "a", name: "Alpha", meta: { code: 10 } },
      { id: "b", name: "Beta", meta: { code: 20 } },
      { id: "c", name: "Gamma", meta: { code: 30 } }
    ],
    settings: { featureX: true, retries: 2 }
  },
  target: {
    items: [
      { id: "c", name: "Gamma", meta: { code: 30 } },
      { id: "x", name: "Extra", meta: { code: 999 } },
      { id: "a", name: "Alpha", meta: { code: 10 } },
      { id: "b", name: "Beta", meta: { code: 20 } }
    ],
    settings: { retries: 2, featureX: true }
  }
} as const;

const panelClass = "p-8";
const inputClass =
  "w-full rounded-xl border-0 bg-[var(--panel)] text-[var(--text)] font-mono text-[14px] leading-relaxed p-3 focus:outline-none";
const jsonInputSizeClass =
  isOutputVisible
    ? "min-h-[160px] max-h-[220px]"
    : "min-h-[520px]";
const buttonBase =
  "cyberpunk-button px-3 py-2 rounded-lg font-sans text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
const buttonPrimary =
  "cyberpunk-button primary px-3 py-2 rounded-lg font-sans text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
  const ctaButton =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-5 py-3 font-sans text-[15px] font-medium text-[var(--muted)] " +
    "cursor-not-allowed transition-colors duration-200 enabled:cursor-pointer enabled:border-transparent enabled:bg-cyan-400 enabled:text-[#0c0e11] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa] " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

  return (
    <Suspense fallback={null}>
      <SearchParamsInit onLoadSample={onLoadSample}>
        <main id="main" className="py-4 flex flex-col">
      <a
        href="#results"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[var(--panel)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--text)] focus:shadow-[var(--shadow)]"
      >
        Skip to results
      </a>

      <div className={flags.adsEnabled ? "flex gap-6 items-start w-full" : "flex items-start w-full"}>
        <div className="flex-1 min-w-0">
      {!isResultsOnly && (
        <>
          {/* Tool Section - full width */}
          <div className="w-full bg-[var(--bg)] px-4 sm:px-6 lg:px-10">
            {/* Visual Anchor */}
            <div id="tool-input">
              <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--panel)] mb-0">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="contents">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="font-sans text-[15px] font-medium text-[var(--text)] tracking-tight">
                    Template A → Target B
                  </h1>
                  <span className="text-[var(--border)]">·</span>
                  <p className="font-mono text-[12px] text-[var(--muted)]">
                    DiffViewr aligns key order and shows only what changed
                  </p>
                    </div>
                    <p className="font-mono text-[11px] leading-none text-[var(--muted)] opacity-80">
                      Tip: Ctrl+Enter / Cmd+Enter to compare
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    {["JSON", "YAML", ".ENV"].map((format) => (
                      <span
                        key={format}
                        className="rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] px-3 py-1 font-mono text-[11px] text-[var(--muted)]"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <JsonInputGrid
                panelClass=""
                inputClass={inputClass}
                jsonInputSizeClass={jsonInputSizeClass}
                buttonBase={buttonBase}
                isOutputVisible={isOutputVisible}
                inputsCollapsed={inputsCollapsed}
                onToggleInputsCollapsed={() => setInputsCollapsed((v) => !v)}
                refText={refText}
                setRefText={setRefText}
                targetText={targetText}
                setTargetText={setTargetText}
                validationA={validationA}
                validationB={validationB}
                onJumpToLineA={(lineNumber) => jumpToTextareaLine("reference-json", lineNumber)}
                onJumpToLineB={(lineNumber) => jumpToTextareaLine("target-json", lineNumber)}
                onPasteA={() => {
                  refImmediateValidateNext.current = true;
                }}
                onPasteB={() => {
                  targetImmediateValidateNext.current = true;
                }}
              />
            </div>
          </div>

          {/* Results Section - full width */}
          <div className="w-full">
            <section id="results" ref={resultSectionRef} className="px-4 sm:px-6 lg:px-10 mt-4">
              <div className="flex flex-col items-center gap-6">
                {bothHaveContent ? (
                  <label className="flex items-center gap-2 text-sm text-[var(--muted)] cyberpunk-checkbox-label">
                    <input
                      type="checkbox"
                      className="cyberpunk-checkbox"
                      checked={reorderArrays}
                      onChange={() => {
                        const next = !reorderArrays;
                        toggleReorderArrays();
                        if (isOutputVisible) sortAndCompare({ reorderArrays: next });
                      }}
                    />
                    <span>Reorder arrays to match A</span>
                  </label>
                ) : null}
              </div>
              <div className="sticky bottom-0 z-20 bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur-sm px-6 py-3 flex items-center justify-between gap-4">
                <div className="w-32 hidden sm:block" />
                <button
                  className={ctaButton}
                  onClick={() => sortAndCompare({ reorderArrays })}
                  type="button"
                  disabled={!bothHaveContent}
                  aria-label="Align and compare the two JSON configurations"
                >
                  {bothHaveContent && <span aria-hidden="true" className="text-cyan-300">✓</span>}
                  <span aria-hidden="true">⇅</span>
                  Compare configs
                </button>
                <div className="w-32 hidden sm:block" />
              </div>

              {error ? (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] p-2 text-[14px]"
                >
                  {error}
                </div>
              ) : null}
              {status ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 rounded-xl border border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] p-2 text-[14px]"
                >
                  {status}
                </div>
              ) : null}
            </section>
          </div>
        </>
      )}

      {isResultsOnly && (
        <div className="w-full">
          <section id="results" ref={resultSectionRef} className="px-4 sm:px-6 lg:px-10 mt-4">
            <OutputSection
              panelClass={panelClass}
              inputClass={inputClass}
              buttonBase={buttonBase}
              buttonPrimary={buttonPrimary}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              resultText={result?.resultText ?? null}
              compare={compare}
              canCopy={canCopy}
              onCopyResult={copyResult}
              onStartAgain={startAgain}
              showFeedbackPrompt={showFeedbackPrompt && activeTab === "compare"}
              rating={rating}
              onRate={setRating}
              onDismissFeedback={() => setShowFeedbackPrompt(false)}
              onSubmitFeedback={() => {
                if (rating > 0) {
                  setRatingCookie(rating);
                  setHasRated(true);
                }
                setShowFeedbackPrompt(false);
              }}
            />
          </section>
        </div>
      )}
        </div>

        {flags.adsEnabled && (
          <aside
            id="ad-rail"
            className="hidden xl:flex flex-col gap-4 w-[300px] shrink-0 pt-4 sticky top-20"
          >
            <div className="border border-dashed border-[var(--border)] rounded-lg flex items-center justify-center min-h-[250px] bg-[color-mix(in_srgb,var(--panel)_40%,transparent)]">
              <span className="font-mono text-[10px] uppercase tracking-[1.6px] text-[var(--muted)] opacity-30">
                300&times;250
              </span>
            </div>

            <div className="border border-dashed border-[var(--border)] rounded-lg flex items-center justify-center min-h-[600px] bg-[color-mix(in_srgb,var(--panel)_40%,transparent)]">
              <span className="font-mono text-[10px] uppercase tracking-[1.6px] text-[var(--muted)] opacity-30">
                300&times;600
              </span>
            </div>
          </aside>
        )}
      </div>

        </main>
      </SearchParamsInit>
    </Suspense>
  );
}

function jumpToTextareaLine(textareaId: string, lineNumber: number) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
  if (!el) return;

  const safeLine = Math.max(1, Math.floor(lineNumber));
  const lines = el.value.split(/\r?\n/);
  const clampedLine = Math.min(safeLine, Math.max(1, lines.length));

  let pos = 0;
  for (let i = 0; i < clampedLine - 1; i += 1) {
    pos += (lines[i]?.length ?? 0) + 1;
  }

  el.focus();
  try {
    el.setSelectionRange(pos, pos);
  } catch {
    // ignore
  }

  const computed = typeof window !== "undefined" ? window.getComputedStyle(el) : null;
  const lh = computed?.lineHeight ?? "18px";
  const lineHeight = lh === "normal" ? 18 : Number.parseFloat(lh) || 18;
  el.scrollTop = Math.max(0, (clampedLine - 1) * lineHeight - el.clientHeight / 3);
}
