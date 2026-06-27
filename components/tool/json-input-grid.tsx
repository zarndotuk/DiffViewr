"use client";

import { useMemo, useState, type ReactNode } from "react";
import { FormatBadge } from "@/components/tool/format-badge";
import { useFormatDetection } from "@/hooks/use-format-detection";
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
  onShowDuplicateIssuesA: () => void;
  onShowDuplicateIssuesB: () => void;
  onPasteA: () => void;
  onPasteB: () => void;
};

type ConfigInputPanelProps = {
  panelClass: string;
  inputClass: string;
  jsonInputSizeClass: string;
  id: string;
  side: "A" | "B";
  sideBadgeClass: string;
  label: string;
  collapsedLabel: string;
  subLabel: string;
  value: string;
  setValue: (v: string) => void;
  validation: ValidationResult | null;
  collapsed: boolean;
  onJumpToLine: (lineNumber: number) => void;
  onShowDuplicateIssues: () => void;
  onPaste: () => void;
  headerAction?: ReactNode;
};

function ConfigInputPanel({
  panelClass,
  inputClass,
  jsonInputSizeClass,
  id,
  side,
  sideBadgeClass,
  label,
  collapsedLabel,
  subLabel,
  value,
  setValue,
  validation,
  collapsed,
  onJumpToLine,
  onShowDuplicateIssues,
  onPaste,
  headerAction
}: ConfigInputPanelProps) {
  const detection = useFormatDetection(value, { debounceMs: 3500 });
  const errorLine =
    validation && !validation.valid && typeof validation.line === "number"
      ? validation.line
      : null;
  const duplicateIssues = validation && !validation.valid ? validation.issues ?? [] : [];
  const hasDuplicateIssues = duplicateIssues.length > 0;
  const [scrollTop, setScrollTop] = useState(0);
  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(1, value.split(/\r\n|\r|\n/).length) }, (_, index) => index + 1),
    [value]
  );

  return (
    <section className={panelClass}>
      <div className="panel-wrapper rounded-xl border border-[var(--border)] focus-within:outline-hidden">
        <div className="flex min-h-12 items-center justify-between gap-2 rounded-t-xl border-b border-[var(--border)] bg-[var(--panel)] px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={sideBadgeClass}>{side}</span>
            <label htmlFor={id} className="font-mono text-[12px] font-medium text-[var(--text)]">
              {label}
            </label>
            <span className="font-mono text-[11px] text-[var(--muted)] hidden sm:inline">
              {subLabel}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={detection.isDetecting ? "opacity-70" : undefined}>
              <FormatBadge format={detection.format} />
            </span>
            {headerAction}
          </div>
        </div>

        {collapsed ? (
          <div className="p-3 text-[14px] text-[var(--muted)]">
            Collapsed. {collapsedLabel} has <strong>{value.length.toLocaleString()}</strong>{" "}
            characters.
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-b-xl">
            <div
              className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 overflow-hidden border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--panel2)_70%,var(--panel))] py-3 pr-2 text-right font-mono text-[16px] leading-relaxed text-[var(--muted)] opacity-65 sm:text-[14px]"
              aria-hidden="true"
            >
              <div style={{ transform: `translateY(-${scrollTop}px)` }}>
                {lineNumbers.map((lineNumber) => (
                  <div key={lineNumber}>{lineNumber}</div>
                ))}
              </div>
            </div>
            <textarea
              id={id}
              className={`${inputClass} ${jsonInputSizeClass} block rounded-t-none pl-16`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
              onPaste={() => {
                detection.markNextChangeImmediate();
                onPaste();
              }}
              placeholder="Paste config here..."
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
              enterKeyHint="done"
              wrap="off"
              aria-invalid={validation ? !validation.valid : undefined}
              aria-busy={detection.isDetecting || undefined}
              suppressHydrationWarning
            />
          </div>
        )}
      </div>
      {!collapsed ? (
        <>
          {validation && !validation.valid && hasDuplicateIssues && (
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-between gap-3 rounded-lg border border-red-400/50 bg-red-400/10 p-3 text-left text-sm text-red-200 transition-colors hover:bg-red-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              onClick={onShowDuplicateIssues}
              aria-label={`Show duplicate key details for ${label}`}
              suppressHydrationWarning
            >
              <span>
                <strong>Duplicate keys found.</strong> Fix before comparing.
              </span>
              <span className="shrink-0 font-mono text-xs text-red-100/85">View details</span>
            </button>
          )}
          {validation && !validation.valid && !hasDuplicateIssues && (
            <div
              className="mt-2 p-3 rounded-lg border border-red-400/50 bg-red-400/10 text-red-300 text-sm"
              role="alert"
              aria-live="polite"
              suppressHydrationWarning
            >
              <strong>Invalid {String(validation.format).toUpperCase()}:</strong> {validation.error}
              {errorLine !== null ? (
                <>
                  <span> (line {errorLine})</span>{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2 hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                    onClick={() => onJumpToLine(errorLine)}
                    aria-label={`Jump to line ${errorLine}`}
                  >
                    Jump
                  </button>
                </>
              ) : null}
            </div>
          )}
          {validation && validation.valid && value.trim() && (
            <div
              className="mt-2 p-2 rounded-lg border border-green-400/50 bg-green-400/10 text-green-300 text-sm"
              aria-live="polite"
              suppressHydrationWarning
            >
              Valid {String(validation.format).toUpperCase()} detected ({value.length.toLocaleString()} characters)
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

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
  onShowDuplicateIssuesA,
  onShowDuplicateIssuesB,
  onPasteA,
  onPasteB
}: Props) {
  const collapsed = isOutputVisible && inputsCollapsed;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
      <ConfigInputPanel
        panelClass={panelClass}
        inputClass={inputClass}
        jsonInputSizeClass={jsonInputSizeClass}
        id="reference-json"
        side="A"
        sideBadgeClass="flex h-5 w-5 items-center justify-center rounded-sm border border-cyan-400/40 font-mono text-[10px] text-cyan-400 shrink-0"
        label="Template"
        collapsedLabel="A"
        subLabel="— source of truth, key order reference"
        value={refText}
        setValue={setRefText}
        validation={validationA}
        collapsed={collapsed}
        onJumpToLine={onJumpToLineA}
        onShowDuplicateIssues={onShowDuplicateIssuesA}
        onPaste={onPasteA}
        headerAction={
          isOutputVisible ? (
            <button
              className={buttonBase}
              type="button"
              aria-expanded={!inputsCollapsed}
              onClick={onToggleInputsCollapsed}
            >
              {inputsCollapsed ? "Expand inputs" : "Collapse inputs"}
            </button>
          ) : null
        }
      />

      <ConfigInputPanel
        panelClass={panelClass}
        inputClass={inputClass}
        jsonInputSizeClass={jsonInputSizeClass}
        id="target-json"
        side="B"
        sideBadgeClass="flex h-5 w-5 items-center justify-center rounded-sm border border-[var(--border)] font-mono text-[10px] text-[var(--muted)] shrink-0"
        label="Target"
        collapsedLabel="B"
        subLabel="— your environment config"
        value={targetText}
        setValue={setTargetText}
        validation={validationB}
        collapsed={collapsed}
        onJumpToLine={onJumpToLineB}
        onShowDuplicateIssues={onShowDuplicateIssuesB}
        onPaste={onPasteB}
      />
    </div>
  );
}
