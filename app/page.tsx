"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { detectIndentFromText, stringifyLikeInput } from "@/lib/stringifyLikeInput";
import { compareJson } from "@/lib/diff/compareJson";
import { buildSummary } from "@/lib/diff/buildSummary";
import type { CompareResult } from "@/lib/diff/types";
import { ToolIntro } from "@/components/tool/tool-intro";
import { ToolInfo } from "@/components/tool/tool-info";
import { JsonInputGrid } from "@/components/tool/json-input-grid";
import { OutputSection } from "@/components/tool/output-section";
import { RatingModal } from "@/components/tool/rating-modal";
import { detectFormat } from "@/lib/detectFormat";
import { validateInput, type ValidationResult } from "@/lib/validateInput";
import { reorderByTemplate } from "@/lib/reorderByTemplate";
import { useReorderArrays } from "@/hooks/useReorderArrays";

type SortResult = {
  resultText: string;
};

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
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
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

  function onLoadSample() {
    clearMessages();
    setRefText(JSON.stringify(SAMPLE.reference, null, 2));
    setTargetText(JSON.stringify(SAMPLE.target, null, 2));
    setResult(null);
    setCompare(null);
    setInputsCollapsed(false);
    setValidationA(null);
    setValidationB(null);
    setViewMode("editing");
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
    setShowShareModal(false);
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
      if (!hasRated) {
        setShowShareModal(true);
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  const panelClass = "p-4";
  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] font-mono text-[12.5px] leading-relaxed p-3 focus:outline-none focus:border-[var(--accent)]";
  const jsonInputSizeClass =
    isOutputVisible
      ? "min-h-[160px] max-h-[220px]"
      : "min-h-[520px]";
  const buttonBase =
    "px-3 py-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] text-sm hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
  const buttonPrimary =
    "px-3 py-2 rounded-lg border border-[var(--accent)] bg-[var(--accent-weak)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
  const ctaButton =
    "inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-full " +
    "bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 " +
    "shadow-[0_0_25px_-5px_rgba(99,102,241,0.5)] transition-all duration-300 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

  return (
    <main id="main" className="py-4 flex flex-col">
      <a
        href="#results"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[var(--panel)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--text)] focus:shadow-[var(--shadow)]"
      >
        Skip to results
      </a>

      {isResultsOnly ? null : (
        <>
          <ToolIntro buttonClass={buttonBase} onLoadSample={onLoadSample} />
          <ToolInfo panelClass={panelClass} />
          <JsonInputGrid
        panelClass={panelClass}
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

      <section id="results" ref={resultSectionRef} className="mt-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {bothHaveContent ? (
            <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <input
                type="checkbox"
                className="accent-[var(--accent)]"
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

          <button
            className={ctaButton}
            onClick={() => sortAndCompare({ reorderArrays })}
            type="button"
          >
            <span aria-hidden="true">⇅</span>
            Align & Compare
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] p-2 text-[13px]"
          >
            {error}
          </div>
        ) : null}
        {status ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-2 rounded-xl border border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] p-2 text-[13px]"
          >
            {status}
          </div>
        ) : null}
      </section>
        </>
      )}

      {isResultsOnly ? (
        <section id="results" ref={resultSectionRef} className="mt-4">
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
          />
        </section>
      ) : (
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
        />
      )}


      <RatingModal
        open={showShareModal}
        rating={rating}
        onRate={setRating}
        onClose={() => setShowShareModal(false)}
        onConfirm={() => {
          if (rating > 0) {
            setRatingCookie(rating);
            setHasRated(true);
          }
          setShowShareModal(false);
        }}
        confirmDisabled={rating === 0}
        buttonBase={buttonBase}
        buttonPrimary={buttonPrimary}
      />

    </main>
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
