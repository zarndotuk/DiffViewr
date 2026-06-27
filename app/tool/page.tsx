"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { CompareResult } from "@/types/diff";
import {
  DuplicateKeysModal,
  type DuplicateIssueGroup
} from "@/components/tool/duplicate-keys-modal";
import { JsonInputGrid } from "@/components/tool/json-input-grid";
import type { OutputSectionProps } from "@/components/tool/output-section";
import type { SupportedFormat, ValidationResult } from "@/lib/validateInput";
import { useReorderArrays } from "@/hooks/use-reorder-arrays";
import { useConfigWorker } from "@/hooks/use-config-worker";
import { flags } from "@/lib/flags";
import { captureEvent } from "@/lib/analytics";

type SortResult = {
  resultText: string;
  targetFormat: SupportedFormat;
};

const MIN_COMPARE_FEEDBACK_MS = 1000;

async function waitForMinimumDuration(startedAt: number) {
  const remaining = MIN_COMPARE_FEEDBACK_MS - (performance.now() - startedAt);
  if (remaining > 0) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, remaining);
    });
  }
}

const OutputSection = dynamic<OutputSectionProps>(
  () => import("@/components/tool/output-section").then((mod) => mod.OutputSection),
  {
    ssr: false,
    loading: () => (
      <section
        className="mt-4 min-h-[420px] rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 text-[14px] text-[var(--muted)]"
        role="status"
        aria-live="polite"
      >
        <div className="h-10 border-b border-[var(--border)]" />
        <div className="mt-4 min-h-[320px] rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_58%,transparent)] p-4">
          <div className="grid grid-cols-2 gap-5">
            {[0, 1].map((pane) => (
              <div key={pane} className="space-y-3">
                <div className="h-3 w-24 rounded-sm bg-slate-700 motion-safe:animate-pulse" />
                <div className="h-2 w-full rounded-sm bg-slate-800 motion-safe:animate-pulse" />
                <div className="h-2 w-4/5 rounded-sm bg-slate-800 motion-safe:animate-pulse" />
                <div className="h-2 w-2/3 rounded-sm bg-slate-800 motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">Preparing results...</span>
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
  const { validate, compare: processCompare } = useConfigWorker();
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
  const [duplicateIssueGroups, setDuplicateIssueGroups] = useState<DuplicateIssueGroup[] | null>(null);
  const refImmediateValidateNext = useRef(false);
  const targetImmediateValidateNext = useRef(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState<boolean>(false);
  const [showStartAgainConfirm, setShowStartAgainConfirm] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const resultSectionRef = useRef<HTMLElement | null>(null);
  const validationARequestRef = useRef(0);
  const validationBRequestRef = useRef(0);
  const comparisonRequestRef = useRef(0);
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
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && bothHaveContent && !isProcessing) {
        sortAndCompare({ reorderArrays });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothHaveContent, isProcessing, reorderArrays]);

  useEffect(() => {
    const requestId = ++validationARequestRef.current;
    const trimmed = refText.trim();
    if (!trimmed) {
      setValidationA(null);
      return;
    }

    const validateInputText = async () => {
      try {
        const response = await validate(refText);
        if (requestId === validationARequestRef.current) {
          setValidationA(response.validation);
        }
      } catch {
        if (requestId === validationARequestRef.current) setValidationA(null);
      }
    };

    if (refImmediateValidateNext.current) {
      refImmediateValidateNext.current = false;
      void validateInputText();
      return;
    }

    const t = setTimeout(() => void validateInputText(), 600);
    return () => clearTimeout(t);
  }, [refText, validate]);

  useEffect(() => {
    const requestId = ++validationBRequestRef.current;
    const trimmed = targetText.trim();
    if (!trimmed) {
      setValidationB(null);
      return;
    }

    const validateInputText = async () => {
      try {
        const response = await validate(targetText);
        if (requestId === validationBRequestRef.current) {
          setValidationB(response.validation);
        }
      } catch {
        if (requestId === validationBRequestRef.current) setValidationB(null);
      }
    };

    if (targetImmediateValidateNext.current) {
      targetImmediateValidateNext.current = false;
      void validateInputText();
      return;
    }

    const t = setTimeout(() => void validateInputText(), 600);
    return () => clearTimeout(t);
  }, [targetText, validate]);

  function setRatingCookie(value: number) {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `diffviewr_rating=${value}; max-age=${maxAge}; path=/; samesite=lax`;
  }

  function submitRating() {
    if (rating <= 0) return;

    captureEvent("visual_compare_rating_submitted", {
      rating,
      reorder_arrays: reorderArrays,
      missing_in_b: compare?.summary.missingInB ?? 0,
      extra_in_b: compare?.summary.extraInB ?? 0,
      changed_values: compare?.summary.changedValues ?? 0,
      type_mismatches: compare?.summary.typeMismatches ?? 0
    });

    setRatingCookie(rating);
    setHasRated(true);
    setShowFeedbackPrompt(false);
  }

  function clearMessages() {
    setError("");
    setStatus("");
  }

  function buildDuplicateIssueGroups(
    nextValidationA: ValidationResult | null,
    nextValidationB: ValidationResult | null
  ): DuplicateIssueGroup[] {
    const groups: DuplicateIssueGroup[] = [];

    if (
      nextValidationA &&
      !nextValidationA.valid &&
      nextValidationA.errorType === "DUPLICATE_KEYS" &&
      nextValidationA.issues?.length
    ) {
      groups.push({
        side: "left",
        label: "Left file, Template A",
        editorId: "reference-json",
        issues: nextValidationA.issues
      });
    }

    if (
      nextValidationB &&
      !nextValidationB.valid &&
      nextValidationB.errorType === "DUPLICATE_KEYS" &&
      nextValidationB.issues?.length
    ) {
      groups.push({
        side: "right",
        label: "Right file, Target B",
        editorId: "target-json",
        issues: nextValidationB.issues
      });
    }

    return groups;
  }

  function editDuplicateFile(group: DuplicateIssueGroup) {
    setDuplicateIssueGroups(null);
    setInputsCollapsed(false);
    setViewMode("editing");
    requestAnimationFrame(() => {
      const firstLine = group.issues.find((issue) => typeof issue.line === "number")?.line ?? 1;
      jumpToTextareaLine(group.editorId, firstLine, true);
    });
  }

  function showDuplicateDetails() {
    const groups = buildDuplicateIssueGroups(validationA, validationB);
    if (groups.length === 0) return;
    setDuplicateIssueGroups(groups);
  }



  function startAgain() {
    setShowStartAgainConfirm(false);
    comparisonRequestRef.current += 1;
    clearMessages();
    setIsProcessing(false);
    setRefText("");
    setTargetText("");
    setResult(null);
    setCompare(null);
    setValidationA(null);
    setValidationB(null);
    setDuplicateIssueGroups(null);
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

  function requestStartAgain() {
    setShowStartAgainConfirm(true);
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
    setDuplicateIssueGroups(null);
    setViewMode("editing");

    // Scroll to tool input after a brief delay to allow state updates
    setTimeout(() => {
      const element = document.getElementById("tool-input");
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function sortAndCompare(options?: { reorderArrays?: boolean }) {
    if (isProcessing || !bothHaveContent) return;

    const effectiveReorderArrays = options?.reorderArrays ?? reorderArrays;
    const requestId = ++comparisonRequestRef.current;
    const startedAt = performance.now();

    clearMessages();
    setDuplicateIssueGroups(null);
    setResult(null);
    setCompare(null);
    setViewMode("editing");
    setIsProcessing(true);
    try {
      const [nextValidationA, nextValidationB] = await Promise.all([
        validate(refText).then((response) => response.validation),
        validate(targetText).then((response) => response.validation)
      ]);
      if (requestId !== comparisonRequestRef.current) return;

      setValidationA(nextValidationA);
      setValidationB(nextValidationB);

      const duplicateGroups = buildDuplicateIssueGroups(nextValidationA, nextValidationB);
      if (duplicateGroups.length > 0) {
        setDuplicateIssueGroups(duplicateGroups);
        return;
      }

      const processed = await processCompare(
        refText,
        targetText,
        effectiveReorderArrays
      );
      await waitForMinimumDuration(startedAt);
      if (requestId !== comparisonRequestRef.current) return;
      setValidationA(processed.validationA);
      setValidationB(processed.validationB);
      setResult({
        resultText: processed.resultText,
        targetFormat: processed.targetFormat
      });
      setStatus(effectiveReorderArrays ? "Reordered B (keys + arrays)." : "Reordered B (keys).");
      setCompare(processed.compare);
      setActiveTab("compare");
      setInputsCollapsed(true);
      setViewMode("results");
      requestAnimationFrame(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      setShowFeedbackPrompt(!hasRated);
    } catch (e) {
      await waitForMinimumDuration(startedAt);
      if (requestId !== comparisonRequestRef.current) return;
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      if (requestId === comparisonRequestRef.current) setIsProcessing(false);
    }
  }

const SAMPLE = {
  reference: {
    Service: "Checkout",
    Logging: {
      LogLevel: {
        Default: "Information",
        Microsoft: "Warning",
        System: "Warning"
      }
    },
    AllowedHosts: "*",
    ConnectionStrings: {
      Main: "Server=db-stg;Database=App;"
    },
    Features: {
      EnableCheckout: true,
      EnableAudit: true,
      EnableBeta: false
    },
    Cache: {
      Provider: "Redis",
      TtlSeconds: 300
    },
    Api: {
      BaseUrl: "https://api.example.com",
      TimeoutSeconds: 30,
      Retries: 3
    },
    Serilog: {
      MinimumLevel: {
        Default: "Information",
        Override: {
          Microsoft: "Warning",
          System: "Warning"
        }
      },
      WriteTo: ["Console"]
    },
    HealthChecks: {
      Enabled: true,
      Path: "/health"
    },
    Telemetry: {
      Enabled: true,
      SampleRate: 0.25
    },
    Deployment: {
      Region: "us-east-1",
      Environment: "staging",
      Slot: "blue",
      Replicas: 2,
      RollingUpdate: true,
      MaxUnavailable: 1,
      MaxSurge: 1,
      DrainSeconds: 30
    }
  },
  target: {
    Deployment: {
      DrainSeconds: 30,
      MaxSurge: 1,
      MaxUnavailable: 1,
      RollingUpdate: true,
      Replicas: 2,
      Slot: "blue",
      Environment: "staging",
      Region: "us-east-1"
    },
    Telemetry: {
      SampleRate: 0.25,
      Enabled: true
    },
    HealthChecks: {
      Path: "/health",
      Enabled: true
    },
    Serilog: {
      WriteTo: ["Console"],
      MinimumLevel: {
        Override: {
          System: "Error",
          Microsoft: "Warning"
        },
        Default: "Debug"
      }
    },
    Api: {
      Retries: 3,
      TimeoutSeconds: 45,
      BaseUrl: "https://api.example.com"
    },
    Cache: {
      TtlSeconds: 300,
      Provider: "Redis"
    },
    Features: {
      EnableBeta: false,
      EnableAudit: true,
      EnableCheckout: true
    },
    ConnectionStrings: {
      Main: "Server=db-stg;Database=App;"
    },
    AllowedHosts: "*",
    Logging: {
      LogLevel: {
        System: "Warning",
        Microsoft: "Warning",
        Default: "Information"
      }
    },
    Service: "Checkout"
  }
} as const;

const panelClass = "p-4 sm:p-6 lg:p-8";
const inputClass =
  "w-full rounded-xl border-0 bg-[var(--panel)] text-[var(--text)] font-mono text-[16px] sm:text-[14px] leading-relaxed p-3 focus:outline-none";
const jsonInputSizeClass =
  isOutputVisible
    ? "min-h-[160px] max-h-[220px]"
    : "min-h-[300px] sm:min-h-[380px] lg:min-h-[520px]";
const buttonBase =
  "cyberpunk-button px-3 py-2 rounded-lg font-sans text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#00d4aa] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
const buttonPrimary =
  "cyberpunk-button primary px-3 py-2 rounded-lg font-sans text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#00d4aa] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
  const ctaButton =
    "inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-5 py-3 font-sans text-[15px] font-medium text-[var(--muted)] " +
    "cursor-not-allowed transition-colors duration-200 enabled:cursor-pointer enabled:border-transparent enabled:bg-cyan-400 enabled:text-[#0c0e11] " +
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#00d4aa] " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

  return (
    <Suspense fallback={null}>
      <SearchParamsInit onLoadSample={onLoadSample}>
        <main
          id="main"
          className="flex flex-col py-2 sm:py-4"
          aria-busy={isProcessing || undefined}
        >
      <a
        href="#results"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[var(--panel)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--text)] focus:shadow-[var(--shadow)]"
      >
        Skip to results
      </a>

      {isProcessing ? (
        <div
          className="modal-overlay-in fixed inset-0 z-40 flex items-center justify-center bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-progress-title"
          aria-describedby="compare-progress-description"
        >
          <div className="modal-card-in w-full max-w-[440px] rounded-xl border border-[color-mix(in_srgb,var(--accent)_32%,var(--border))] bg-[var(--panel)] p-5 shadow-[0_24px_70px_rgba(0,8,13,0.52)] sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <i className="ti ti-adjustments-horizontal text-[19px]" aria-hidden="true" />
              </div>
              <div>
                <h2 id="compare-progress-title" className="font-sans text-[17px] font-medium text-[var(--text)]">
                  Comparing configs
                </h2>
                <p id="compare-progress-description" className="mt-1 font-sans text-[13px] leading-relaxed text-[var(--muted)]">
                  Aligning Template A with Target B and isolating meaningful changes.
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_58%,transparent)] p-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="space-y-2">
                  <div className="h-2 w-3/4 rounded-sm bg-slate-700 motion-safe:animate-pulse" />
                  <div className="h-2 w-full rounded-sm bg-slate-800 motion-safe:animate-pulse" />
                  <div className="h-2 w-2/3 rounded-sm bg-slate-800 motion-safe:animate-pulse" />
                </div>
                <i className="ti ti-arrow-right text-[16px] text-cyan-400" aria-hidden="true" />
                <div className="space-y-2">
                  <div className="h-2 w-2/3 rounded-sm bg-cyan-400/25 motion-safe:animate-pulse" />
                  <div className="h-2 w-full rounded-sm bg-slate-800 motion-safe:animate-pulse" />
                  <div className="h-2 w-4/5 rounded-sm bg-emerald-400/20 motion-safe:animate-pulse" />
                </div>
              </div>
            </div>

            <p className="mt-4 font-mono text-[11px] text-[var(--muted)]" role="status" aria-live="polite">
              Processing locally in your browser
            </p>
          </div>
        </div>
      ) : null}

      <div className={flags.adsEnabled ? "flex gap-6 items-start w-full" : "flex items-start w-full"}>
        <div className="flex-1 min-w-0">
      {!isResultsOnly && (
        <>
          {/* Tool Section - full width */}
          <div className="w-full bg-[var(--bg)] px-0 sm:px-2 lg:px-10">
            {/* Visual Anchor */}
            <div id="tool-input">
              <div className="mb-0 flex flex-col items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--panel)] px-3 py-3 sm:flex-row sm:gap-4 sm:px-4">
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
                      <span className="hidden sm:inline">Tip: Ctrl+Enter / Cmd+Enter to compare</span>
                      <span className="sm:hidden">Paste both configs, then compare below</span>
                    </p>
                  </div>
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <div className="flex flex-wrap gap-2">
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

            <div className="mt-4 sm:mt-6 lg:mt-8">
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
                onShowDuplicateIssuesA={showDuplicateDetails}
                onShowDuplicateIssuesB={showDuplicateDetails}
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
            <section id="results" ref={resultSectionRef} className="mt-4 px-0 sm:px-2 lg:px-10">
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
                        if (isOutputVisible) void sortAndCompare({ reorderArrays: next });
                      }}
                    />
                    <span>Reorder arrays to match A</span>
                  </label>
                ) : null}
              </div>
              <div className="mobile-safe-action sticky bottom-0 z-20 flex items-center justify-between gap-4 bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] px-0 py-3 backdrop-blur-xs sm:px-6">
                <div className="w-32 hidden sm:block" />
                <button
                  className={ctaButton}
                  onClick={() => void sortAndCompare({ reorderArrays })}
                  type="button"
                  disabled={!bothHaveContent || isProcessing}
                  aria-label="Align and compare the two JSON configurations"
                >
                  {bothHaveContent && <span aria-hidden="true" className="text-cyan-300">✓</span>}
                  <span aria-hidden="true">⇅</span>
                  {isProcessing ? "Comparing..." : "Compare configs"}
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
          <section id="results" ref={resultSectionRef} className="mt-2 px-0 sm:mt-4 sm:px-2 lg:px-10">
            <OutputSection
              panelClass={panelClass}
              inputClass={inputClass}
              buttonBase={buttonBase}
              buttonPrimary={buttonPrimary}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              resultText={result?.resultText ?? null}
              resultFormat={result?.targetFormat ?? "json"}
              compare={compare}
              canCopy={canCopy}
              onCopyResult={copyResult}
              onStartAgain={requestStartAgain}
              showFeedbackPrompt={showFeedbackPrompt && activeTab === "compare"}
              rating={rating}
              onRate={setRating}
              onDismissFeedback={() => setShowFeedbackPrompt(false)}
              onSubmitFeedback={submitRating}
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

      {duplicateIssueGroups ? (
        <DuplicateKeysModal groups={duplicateIssueGroups} onEditFile={editDuplicateFile} />
      ) : null}

      {showStartAgainConfirm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6">
          <section
            className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-again-title"
          >
            <h2 id="start-again-title" className="text-lg font-semibold tracking-tight text-[var(--text)]">
              Start a new comparison?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              This clears both editors and the current comparison result.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
                onClick={() => setShowStartAgainConfirm(false)}
              >
                Stay here
              </button>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#0c0e11] transition-transform active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
                onClick={startAgain}
              >
                Start new comparison
              </button>
            </div>
          </section>
        </div>
      ) : null}

        </main>
      </SearchParamsInit>
    </Suspense>
  );
}

function jumpToTextareaLine(textareaId: string, lineNumber: number, selectLine = false) {
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
    const end = selectLine ? pos + (lines[clampedLine - 1]?.length ?? 0) : pos;
    el.setSelectionRange(pos, end);
  } catch {
    // ignore
  }

  const computed = typeof window !== "undefined" ? window.getComputedStyle(el) : null;
  const lh = computed?.lineHeight ?? "18px";
  const lineHeight = lh === "normal" ? 18 : Number.parseFloat(lh) || 18;
  el.scrollTop = Math.max(0, (clampedLine - 1) * lineHeight - el.clientHeight / 3);
}
