"use client";

import { ValidationStatus } from "@/components/tool/validation-status";
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
  const refDetection = useFormatDetection(refText, { debounceMs: 600 });
  const targetDetection = useFormatDetection(targetText, { debounceMs: 600 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className={panelClass}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex min-w-0 items-center gap-2">
            <label htmlFor="reference-json" className="text-sm text-[var(--muted)] font-semibold">
              Template (A)
            </label>
            <span className={refDetection.isDetecting ? "opacity-70" : undefined}>
              <FormatBadge format={refDetection.format} />
            </span>
            {validationA ? (
              <span className="min-w-0">
                <ValidationStatus result={validationA} onJumpToLine={onJumpToLineA} />
              </span>
            ) : null}
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
          <div className="text-[13px] text-[var(--muted)]">
            Collapsed. A has <strong>{refText.length.toLocaleString()}</strong>{" "}
            characters.
          </div>
        ) : (
          <>
            <div id="reference-help" className="mb-2 text-[12.5px] text-[var(--muted)]">
              Used as the ordering template only. Its values are never copied into Target (B).
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
              aria-describedby="reference-help"
              aria-invalid={validationA ? !validationA.valid : undefined}
              aria-busy={refDetection.isDetecting || undefined}
            />
          </>
        )}
      </section>

      <section className={panelClass}>
        <div className="flex items-center gap-2 mb-2">
          <label
            htmlFor="target-json"
            className="text-sm text-[var(--muted)] font-semibold block"
          >
            Target (B)
          </label>
          <span className={targetDetection.isDetecting ? "opacity-70" : undefined}>
            <FormatBadge format={targetDetection.format} />
          </span>
          {validationB ? (
            <span className="min-w-0">
              <ValidationStatus result={validationB} onJumpToLine={onJumpToLineB} />
            </span>
          ) : null}
        </div>
        {isOutputVisible && inputsCollapsed ? (
          <div className="text-[13px] text-[var(--muted)]">
            Collapsed. B has <strong>{targetText.length.toLocaleString()}</strong>{" "}
            characters.
          </div>
        ) : (
          <>
            <div id="target-help" className="mb-2 text-[12.5px] text-[var(--muted)]">
              This will be reordered for comparison purpose. Your data stays in B; only ordering
              changes.
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
              aria-describedby="target-help"
              aria-invalid={validationB ? !validationB.valid : undefined}
              aria-busy={targetDetection.isDetecting || undefined}
            />
          </>
        )}
      </section>
    </div>
  );
}
