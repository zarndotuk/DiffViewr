"use client";

import { FormatBadge } from "@/components/tool/format-badge";
import { useFormatDetection } from "@/hooks/useFormatDetection";
import type { ValidationResult } from "@/lib/validateInput";

type Props = {
  panelClass: string;
  inputClass: string;
  jsonInputSizeClass: string;
  buttonBase: string;
  isOutputVisible: boolean;
  inputsCollapsed: boolean;
  onToggleInputsCollapsed: () => void;
  refText: string;
  setRefText: (v: string) => void;
  targetText: string;
  setTargetText: (v: string) => void;
  validationA: ValidationResult | null;
  validationB: ValidationResult | null;
  onJumpToLineA: (lineNumber: number) => void;
  onJumpToLineB: (lineNumber: number) => void;
  onPasteA: () => void;
  onPasteB: () => void;
};

export function JsonInputGrid({
  panelClass,
  inputClass,
  jsonInputSizeClass,
  buttonBase,
  isOutputVisible,
  inputsCollapsed,
  onToggleInputsCollapsed,
  refText,
  setRefText,
  targetText,
  setTargetText,
  validationA,
  validationB,
  onJumpToLineA,
  onJumpToLineB,
  onPasteA,
  onPasteB
}: Props) {
  const refDetection = useFormatDetection(refText, { debounceMs: 300 });
  const targetDetection = useFormatDetection(targetText, { debounceMs: 300 });
  const refErrorLine = validationA && !validationA.valid && typeof validationA.line === "number" ? validationA.line : null;
  const targetErrorLine = validationB && !validationB.valid && typeof validationB.line === "number" ? validationB.line : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section className={panelClass}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex min-w-0 items-center gap-2">
            <label htmlFor="reference-json" className="text-sm text-[var(--muted)] font-semibold">
              Template (A) <span className="text-red-400">*</span>
              <span className="text-xs font-normal block mt-1 text-[var(--muted)]">
                Your source of truth — key order is used as the reference
              </span>
            </label>
            <span className={refDetection.isDetecting ? "opacity-70" : undefined}>
              <FormatBadge format={refDetection.format} />
            </span>
          </div>
          {isOutputVisible ? (
            <button
              className={buttonBase}
              type="button"
              aria-expanded={!inputsCollapsed}
              onClick={onToggleInputsCollapsed}
            >
              {inputsCollapsed ? "Expand inputs" : "Collapse inputs"}
            </button>
          ) : null}
        </div>

        {isOutputVisible && inputsCollapsed ? (
          <div className="text-[14px] text-[var(--muted)]">
            Collapsed. A has <strong>{refText.length.toLocaleString()}</strong>{" "}
            characters.
          </div>
        ) : (
          <>
            <div id="reference-help" className="mb-2 text-[14px] text-[var(--muted)]">
              <div className="mb-1">
                📋 Paste your template or master config (appsettings.tpl.json, base.yaml, .env.example)
              </div>
              <div className="text-xs opacity-80">
                Used as the key-order reference only. Values are never copied from here.
              </div>
            </div>
            <textarea
              id="reference-json"
              className={`${inputClass} ${jsonInputSizeClass}`}
              value={refText}
              onChange={(e) => setRefText(e.target.value)}
              onPaste={() => {
                refDetection.markNextChangeImmediate();
                onPasteA();
              }}
              placeholder="Paste config here…"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
              enterKeyHint="done"
              aria-describedby="reference-help"
              aria-invalid={validationA ? !validationA.valid : undefined}
              aria-busy={refDetection.isDetecting || undefined}
              suppressHydrationWarning
            />
            {validationA && !validationA.valid && (
              <div
                className="mt-2 p-3 rounded-lg border border-red-400/50 bg-red-400/10 text-red-300 text-sm"
                role="alert"
                aria-live="polite"
                suppressHydrationWarning
              >
                <strong>Invalid {String(validationA.format).toUpperCase()}:</strong> {validationA.error}
                {refErrorLine !== null ? (
                  <>
                    <span> (line {refErrorLine})</span>{" "}
                    <button
                      type="button"
                      className="underline underline-offset-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                      onClick={() => onJumpToLineA(refErrorLine)}
                      aria-label={`Jump to line ${refErrorLine}`}
                    >
                      Jump
                    </button>
                  </>
                ) : null}
              </div>
            )}
            {validationA && validationA.valid && refText.trim() && (
              <div
                className="mt-2 p-2 rounded-lg border border-green-400/50 bg-green-400/10 text-green-300 text-sm"
                aria-live="polite"
                suppressHydrationWarning
              >
                ✓ Valid JSON detected ({refText.length.toLocaleString()} characters)
              </div>
            )}
          </>
        )}
      </section>

      <section className={panelClass}>
        <div className="flex items-center gap-2 mb-2">
          <label
            htmlFor="target-json"
            className="text-sm text-[var(--muted)] font-semibold block"
          >
            Target (B) <span className="text-red-400">*</span>
            <span className="text-xs font-normal block mt-1 text-[var(--muted)]">
              Your environment config — values are compared against Template A
            </span>
          </label>
          <span className={targetDetection.isDetecting ? "opacity-70" : undefined}>
            <FormatBadge format={targetDetection.format} />
          </span>
        </div>
        {isOutputVisible && inputsCollapsed ? (
          <div className="text-[14px] text-[var(--muted)]">
            Collapsed. B has <strong>{targetText.length.toLocaleString()}</strong>{" "}
            characters.
          </div>
        ) : (
          <>
            <div id="target-help" className="mb-2 text-[14px] text-[var(--muted)]">
              <div className="mb-1">
                📋 Paste your environment config (appsettings.stg.json, prod.yaml, .env)
              </div>
              <div className="text-xs opacity-80">
                Key order will be aligned to Template A. Only real value differences are shown.
              </div>
            </div>
            <textarea
              id="target-json"
              className={`${inputClass} ${jsonInputSizeClass}`}
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              onPaste={() => {
                targetDetection.markNextChangeImmediate();
                onPasteB();
              }}
              placeholder="Paste config here…"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
              enterKeyHint="done"
              aria-describedby="target-help"
              aria-invalid={validationB ? !validationB.valid : undefined}
              aria-busy={targetDetection.isDetecting || undefined}
              suppressHydrationWarning
            />
            {validationB && !validationB.valid && (
              <div
                className="mt-2 p-3 rounded-lg border border-red-400/50 bg-red-400/10 text-red-300 text-sm"
                role="alert"
                aria-live="polite"
                suppressHydrationWarning
              >
                <strong>Invalid {String(validationB.format).toUpperCase()}:</strong> {validationB.error}
                {targetErrorLine !== null ? (
                  <>
                    <span> (line {targetErrorLine})</span>{" "}
                    <button
                      type="button"
                      className="underline underline-offset-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                      onClick={() => onJumpToLineB(targetErrorLine)}
                      aria-label={`Jump to line ${targetErrorLine}`}
                    >
                      Jump
                    </button>
                  </>
                ) : null}
              </div>
            )}
            {validationB && validationB.valid && targetText.trim() && (
              <div
                className="mt-2 p-2 rounded-lg border border-green-400/50 bg-green-400/10 text-green-300 text-sm"
                aria-live="polite"
                suppressHydrationWarning
              >
                ✓ Valid JSON detected ({targetText.length.toLocaleString()} characters)
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
