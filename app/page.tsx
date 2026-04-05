"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseJsonText } from "@/lib/jsonText";
import { getNodeByPath, parseJsonPath, setNodeByPath } from "@/lib/jsonPath";
import { reorderArrayAtPath } from "@/lib/reorderArray";
import { reorderObjectKeysAtPath } from "@/lib/reorderObject";
import type { Diagnostics } from "@/lib/diagnostics";
import { detectIndentFromText, stringifyLikeInput } from "@/lib/stringifyLikeInput";
import { compareJson } from "@/lib/diff/compareJson";
import { buildSummary } from "@/lib/diff/buildSummary";
import type { CompareResult } from "@/lib/diff/types";
import { VisualComparePanel } from "@/components/compare/visual-compare-panel";
import {
  isPlainObject,
  isPrimitive,
  serializePrimitiveKey,
  serializeValueKey,
  type Primitive
} from "@/lib/serialize";

type SortResult = {
  resultText: string;
  diagnostics: Diagnostics;
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
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [refText, setRefText] = useState<string>("");
  const [targetText, setTargetText] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<SortResult | null>(null);
  const [compare, setCompare] = useState<CompareResult | null>(null);
  const [activeTab, setActiveTab] = useState<"result" | "compare">("result");
  const [validationA, setValidationA] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [validationB, setValidationB] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [effectiveMatchField, setEffectiveMatchField] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const resultSectionRef = useRef<HTMLElement | null>(null);

  const canCopy = useMemo(
    () => Boolean(result?.resultText?.length),
    [result?.resultText]
  );

  useEffect(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
      return;
    }
    setTheme("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("json_tool_rating="));
    if (cookie) setHasRated(true);
  }, []);

  function setRatingCookie(value: number) {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `json_tool_rating=${value}; max-age=${maxAge}; path=/; samesite=lax`;
  }

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }
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
    setValidationA(null);
    setValidationB(null);
    setEffectiveMatchField("");
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

  function sortAndCompare() {
    clearMessages();
    setResult(null);
    setCompare(null);

    let refJson: unknown;
    let targetJson: unknown;
    try {
      refJson = parseJsonText(refText, "Reference JSON (A)");
      setValidationA({ ok: true, message: "Valid JSON." });
    } catch (e) {
      setValidationA({ ok: false, message: String(e instanceof Error ? e.message : e) });
      setValidationB(null);
      setError("Fix Reference JSON (A) to continue.");
      return;
    }
    try {
      targetJson = parseJsonText(targetText, "Target JSON (B)");
      setValidationB({ ok: true, message: "Valid JSON." });
    } catch (e) {
      setValidationB({ ok: false, message: String(e instanceof Error ? e.message : e) });
      setError("Fix Target JSON (B) to continue.");
      return;
    }

    const targetPath = "$";
    const matchFieldPath = "";
    let tokens;
    try {
      tokens = parseJsonPath(targetPath);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      return;
    }

    let aNode: unknown;
    let bNode: unknown;
    try {
      aNode = getNodeByPath(refJson, tokens);
      bNode = getNodeByPath(targetJson, tokens);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      return;
    }

    if (Array.isArray(aNode) && Array.isArray(bNode)) {
      try {
        const mode = detectArrayMode(aNode, bNode);
        const detected = mode === "objects" ? detectMatchField(aNode, bNode) : "";
        let matchPathToUse = matchFieldPath.trim() || detected;
        const matchByValue = mode === "objects" && !matchPathToUse;
        const { diagnostics } = reorderArrayAtPath({
          referenceArray: aNode,
          targetArray: bNode,
          matchFieldPath: matchPathToUse,
          unmatchedHandling: "append"
        });
        const reorderedNode = reorderArrayDeep(aNode, bNode);
        const nextRoot = setNodeByPath(targetJson, tokens, reorderedNode);
        const resultText = stringifyLikeInput(nextRoot, targetText);
        const indentA = detectIndentFromText(refText) ?? 2;
        const indentB = detectIndentFromText(targetText) ?? 2;
        setResult({ resultText, diagnostics });
        setStatus(
          `Sorted array at root. ${matchByValue ? "Auto-match: by value" : matchPathToUse ? `Auto-match: ${matchPathToUse}` : ""}`.trim()
        );
        const root = compareJson(refJson, nextRoot, "$", "$", matchPathToUse);
        setCompare({
          root,
          summary: buildSummary(root),
          aRoot: refJson,
          bRoot: nextRoot,
          aIndent: indentA,
          bIndent: indentB
        });
        setEffectiveMatchField(matchPathToUse);
        setActiveTab("result");
        requestAnimationFrame(() => {
          resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        if (!hasRated) setShowShareModal(true);
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      }
      return;
    }

    const aIsObject =
      typeof aNode === "object" && aNode !== null && !Array.isArray(aNode);
    const bIsObject =
      typeof bNode === "object" && bNode !== null && !Array.isArray(bNode);
    if (aIsObject && bIsObject) {
      try {
        const { diagnostics } = reorderObjectKeysAtPath({
          referenceObject: aNode as Record<string, unknown>,
          targetObject: bNode as Record<string, unknown>
        });
        const reorderedNode = reorderObjectDeep(
          aNode as Record<string, unknown>,
          bNode as Record<string, unknown>
        );
        const nextRoot = setNodeByPath(targetJson, tokens, reorderedNode);
        const resultText = stringifyLikeInput(nextRoot, targetText);
        const indentA = detectIndentFromText(refText) ?? 2;
        const indentB = detectIndentFromText(targetText) ?? 2;
        setResult({ resultText, diagnostics });
        setStatus("Sorted object keys at root.");
        const root = compareJson(refJson, nextRoot, "$", "$", matchFieldPath.trim());
        setCompare({
          root,
          summary: buildSummary(root),
          aRoot: refJson,
          bRoot: nextRoot,
          aIndent: indentA,
          bIndent: indentB
        });
        setEffectiveMatchField(matchFieldPath.trim());
        setActiveTab("result");
        requestAnimationFrame(() => {
          resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        if (!hasRated) setShowShareModal(true);
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      }
      return;
    }

    if (Array.isArray(aNode) || Array.isArray(bNode)) {
      setError(
        "Node type mismatch at target path: one is an array and the other is not."
      );
      return;
    }

    if (aIsObject || bIsObject) {
      setError(
        "Node type mismatch at target path: one is an object and the other is not."
      );
      return;
    }

    setError(
      "Target node is a primitive value. Only arrays and objects can be reordered."
    );
  }

  function detectMatchField(refArray: unknown[], targetArray: unknown[]) {
    const candidates = ["key", "id", "name"];
    for (const candidate of candidates) {
      const okRef = refArray.every(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          candidate in (item as Record<string, unknown>) &&
          isPrimitive((item as Record<string, unknown>)[candidate])
      );
      if (!okRef) continue;
      const okTarget = targetArray.every(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          candidate in (item as Record<string, unknown>) &&
          isPrimitive((item as Record<string, unknown>)[candidate])
      );
      if (okTarget) return candidate;
    }
    return "";
  }

  function detectArrayMode(refArray: unknown[], targetArray: unknown[]) {
    const refPrimitive = refArray.every((v) => isPrimitive(v));
    const targetPrimitive = targetArray.every((v) => isPrimitive(v));
    if (refPrimitive && targetPrimitive) return "primitives";
    return "objects";
  }

  function reorderArrayDeep(referenceArray: unknown[], targetArray: unknown[]) {
    const mode = detectArrayMode(referenceArray, targetArray);
    if (mode === "primitives") {
      const { reorderedNode } = reorderArrayAtPath({
        referenceArray,
        targetArray,
        matchFieldPath: "",
        unmatchedHandling: "append"
      });
      return reorderedNode;
    }

    const matchField = detectMatchField(referenceArray, targetArray);
    const fieldTokens = matchField
      ? parseJsonPath(
          matchField.startsWith("[") || matchField.startsWith(".")
            ? `$${matchField}`
            : `$.${matchField}`
        )
      : null;

    const bKeyToIndices = new Map<string, number[]>();
    for (let i = 0; i < targetArray.length; i += 1) {
      const item = targetArray[i];
      const key = fieldTokens
        ? serializePrimitiveKey(getNodeByPath(item, fieldTokens) as Primitive)
        : serializeValueKey(item);
      const queue = bKeyToIndices.get(key);
      if (queue) queue.push(i);
      else bKeyToIndices.set(key, [i]);
    }

    const used = new Array<boolean>(targetArray.length).fill(false);
    const matched: unknown[] = [];

    for (const refItem of referenceArray) {
      const key = fieldTokens
        ? serializePrimitiveKey(getNodeByPath(refItem, fieldTokens) as Primitive)
        : serializeValueKey(refItem);
      const queue = bKeyToIndices.get(key);
      if (!queue || queue.length === 0) continue;
      const idx = queue.shift() as number;
      used[idx] = true;
      matched.push(reorderDeep(refItem, targetArray[idx]));
    }

    const extras: unknown[] = [];
    for (let i = 0; i < targetArray.length; i += 1) {
      if (!used[i]) extras.push(reorderDeep(targetArray[i], targetArray[i]));
    }

    return matched.concat(extras);
  }

  function reorderObjectDeep(
    referenceObject: Record<string, unknown>,
    targetObject: Record<string, unknown>
  ) {
    const next: Record<string, unknown> = {};
    const keys = [
      ...Object.keys(referenceObject),
      ...Object.keys(targetObject).filter((k) => !(k in referenceObject))
    ];

    for (const key of keys) {
      if (!(key in targetObject)) continue;
      const aVal = referenceObject[key];
      const bVal = targetObject[key];
      if (Array.isArray(aVal) && Array.isArray(bVal)) {
        next[key] = reorderArrayDeep(aVal, bVal);
      } else if (isPlainObject(aVal) && isPlainObject(bVal)) {
        next[key] = reorderObjectDeep(aVal, bVal);
      } else {
        next[key] = bVal;
      }
    }

    return next;
  }

  function reorderDeep(aVal: unknown, bVal: unknown): unknown {
    if (Array.isArray(aVal) && Array.isArray(bVal)) {
      return reorderArrayDeep(aVal, bVal);
    }
    if (isPlainObject(aVal) && isPlainObject(bVal)) {
      return reorderObjectDeep(aVal, bVal);
    }
    return bVal;
  }

  const panelClass =
    "rounded-xl border border-[var(--border)] bg-[linear-gradient(180deg,var(--panel),var(--panel2))] shadow-[var(--shadow)] p-4";
  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_85%,transparent)] text-[var(--text)] font-mono text-[12.5px] leading-relaxed p-3 focus:outline-none focus:border-[var(--accent)]";
  const buttonBase =
    "px-3 py-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] text-sm hover:border-[var(--accent)]";
  const buttonPrimary =
    "px-3 py-2 rounded-lg border border-[var(--accent)] bg-[var(--accent-weak)] text-sm";

  return (
    <main className="w-[85%] mx-auto p-6 flex flex-col min-h-screen">
      <header className="rounded-2xl p-4 shadow-[var(--shadow)] mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl tracking-wide font-semibold">JSON Reorder Tool</h1>
            <p className="text-[13px] text-[var(--muted)] mt-1 leading-relaxed">
              Paste Reference JSON (A) and Target JSON (B). Reorder only the{" "}
              <strong>ordering</strong> at a JSON path (default <code>$</code>).
              No backend, no uploads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={buttonBase}
              onClick={toggleTheme}
              type="button"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              <span className="text-base">{theme === "light" ? "🌙" : "☀️"}</span>
            </button>
            <button
              className={buttonBase}
              onClick={onLoadSample}
              type="button"
              aria-label="Load sample JSON"
              title="Load sample JSON"
            >
              <span className="text-base">✨</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mb-3 rounded-lg border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-2 text-[12.5px] text-[var(--muted)]">
        <strong className="text-[var(--text)]">🔒 Privacy-first:</strong> Your JSON is
        processed entirely in your browser. We do not collect or store your data.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className={panelClass}>
          <h2 className="text-sm text-[var(--muted)] font-semibold mb-2">
            1) Reference JSON (A)
          </h2>
          <textarea
            className={`${inputClass} min-h-[520px]`}
            value={refText}
            onChange={(e) => setRefText(e.target.value)}
            placeholder='Paste JSON here. Example: {"items":[{"id":"a"},{"id":"b"}]}'
            spellCheck={false}
          />
          {validationA ? (
            <div className="mt-2 text-[13px] text-[var(--muted)]">
              {validationA.ok ? "Valid JSON." : validationA.message}
            </div>
          ) : null}
        </section>

        <section className={panelClass}>
          <h2 className="text-sm text-[var(--muted)] font-semibold mb-2">
            2) Target JSON (B)
          </h2>
          <textarea
            className={`${inputClass} min-h-[520px]`}
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            placeholder='Paste JSON here. Example: {"items":[{"id":"b"},{"id":"a"}]}'
            spellCheck={false}
          />
          {validationB ? (
            <div className="mt-2 text-[13px] text-[var(--muted)]">
              {validationB.ok ? "Valid JSON." : validationB.message}
            </div>
          ) : null}
        </section>
      </div>

      {(validationA || validationB) && (
        <div className={`${panelClass} mt-4`}>
          <h2 className="text-sm text-[var(--muted)] font-semibold mb-2">
            Validation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
            <div
              className={`rounded-xl border p-2 ${
                validationA?.ok
                  ? "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]"
              }`}
            >
              <strong>Reference (A):</strong>{" "}
              {validationA ? (validationA.ok ? "Valid JSON." : validationA.message) : "Not checked yet."}
            </div>
            <div
              className={`rounded-xl border p-2 ${
                validationB?.ok
                  ? "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]"
              }`}
            >
              <strong>Target (B):</strong>{" "}
              {validationB ? (validationB.ok ? "Valid JSON." : validationB.message) : "Not checked yet."}
            </div>
          </div>
        </div>
      )}

      <section ref={resultSectionRef} className="mt-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <button className={buttonPrimary} onClick={sortAndCompare} type="button">
            Sort & Compare
          </button>
          {result ? (
            <button
              className={buttonBase}
              onClick={copyResult}
              type="button"
              disabled={!canCopy}
            >
              Copy Result
            </button>
          ) : null}
          {effectiveMatchField ? (
            <span className="text-xs px-2 py-1 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_70%,transparent)]">
              Auto-match: <strong>{effectiveMatchField}</strong>
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="mt-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] p-2 text-[13px]">
            {error}
          </div>
        ) : null}
        {status ? (
          <div className="mt-2 rounded-xl border border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] p-2 text-[13px]">
            {status}
          </div>
        ) : null}
      </section>

      {result || compare ? (
        <section className={`${panelClass} mt-4`}>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              className={activeTab === "result" ? buttonPrimary : buttonBase}
              onClick={() => setActiveTab("result")}
              type="button"
            >
              Sorted Result
            </button>
            <button
              className={activeTab === "compare" ? buttonPrimary : buttonBase}
              onClick={() => setActiveTab("compare")}
              type="button"
            >
              Visual Compare
            </button>
          </div>
          {activeTab === "result" ? (
            <>
              <h2 className="text-sm text-[var(--muted)] font-semibold mb-2">4) Result</h2>
              <textarea
                className={`${inputClass} min-h-[260px]`}
                value={result?.resultText ?? ""}
                readOnly
                placeholder="Sorted JSON appears here."
                spellCheck={false}
              />
            </>
          ) : (
            <>
              <h2 className="text-sm text-[var(--muted)] font-semibold mb-2">
                4) Visual Compare
              </h2>
              {compare ? (
                <VisualComparePanel result={compare} />
              ) : (
                <div className="text-[13px] text-[var(--muted)]">
                  Run <strong>Sort & Compare</strong> to see differences.
                </div>
              )}
            </>
          )}
        </section>
      ) : null}

      {showShareModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] p-5 shadow-[var(--shadow)]">
            <div className="text-sm text-[var(--muted)] mb-1">Quick favor</div>
            <h3 className="text-lg font-semibold">How was the experience?</h3>
            <p className="text-[13px] text-[var(--muted)] mt-2 leading-relaxed">
              A quick star rating helps us improve.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`text-2xl transition-transform ${
                    rating >= star ? "text-[var(--accent)]" : "text-[var(--muted)]"
                  } hover:scale-110`}
                  aria-label={`${star} star`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className={buttonPrimary}
                type="button"
                onClick={() => {
                  if (rating > 0) {
                    setRatingCookie(rating);
                    setHasRated(true);
                  }
                  setShowShareModal(false);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="mt-auto text-center text-xs text-[var(--muted)] rounded-xl p-3">
        Free forever • Privacy-first • Support the project or ☕ Support
      </footer>
    </main>
  );
}

