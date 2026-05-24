"use client";

import type { ReactNode } from "react";
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
  onPaste,
  headerAction
}: ConfigInputPanelProps) {
  const detection = useFormatDetection(value, { debounceMs: 3500 });
  const errorLine =
    validation && !validation.valid && typeof validation.line === "number"
      ? validation.line
      : null;

  return (
    <section className={panelClass}>
      <div className="panel-wrapper rounded-xl border border-[var(--border)] focus-within:outline-none">
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--panel)] border-b border-[var(--border)] rounded-t-xl">
          <div className="flex min-w-0 items-center gap-2">
            <span className={sideBadgeClass}>{side}</span>
            <label htmlFor={id} className="font-mono text-[12px] font-medium text-[var(--text)]">
              {label}
            </label>
            <span className="font-mono text-[11px] text-[var(--muted)] hidden sm:inline">
              {subLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={detection.isDetecting ? "opacity-70" : undefined}>
              <FormatBadge format={detection.format} />
            </span>
            {headerAction}
          </div>
        </div>

        {collapsed ? (
          <div className="text-[14px] text-[var(--muted)]">
            Collapsed. {collapsedLabel} has <strong>{value.length.toLocaleString()}</strong>{" "}
            characters.
          </div>
        ) : (
          <textarea
            id={id}
            className={`${inputClass} ${jsonInputSizeClass} rounded-t-none`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
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
            aria-invalid={validation ? !validation.valid : undefined}
            aria-busy={detection.isDetecting || undefined}
            suppressHydrationWarning
          />
        )}
      </div>
      {!collapsed ? (
        <>
          {validation && !validation.valid && (
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
                    className="underline underline-offset-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
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
              Valid JSON detected ({value.length.toLocaleString()} characters)
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
  onPasteA,
  onPasteB
}: Props) {
  const collapsed = isOutputVisible && inputsCollapsed;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ConfigInputPanel
        panelClass={panelClass}
        inputClass={inputClass}
        jsonInputSizeClass={jsonInputSizeClass}
        id="reference-json"
        side="A"
        sideBadgeClass="flex h-5 w-5 items-center justify-center rounded border border-cyan-400/40 font-mono text-[10px] text-cyan-400 shrink-0"
        label="Template"
        collapsedLabel="A"
        subLabel="— source of truth, key order reference"
        value={refText}
        setValue={setRefText}
        validation={validationA}
        collapsed={collapsed}
        onJumpToLine={onJumpToLineA}
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
        sideBadgeClass="flex h-5 w-5 items-center justify-center rounded border border-[var(--border)] font-mono text-[10px] text-[var(--muted)] shrink-0"
        label="Target"
        collapsedLabel="B"
        subLabel="— your environment config"
        value={targetText}
        setValue={setTargetText}
        validation={validationB}
        collapsed={collapsed}
        onJumpToLine={onJumpToLineB}
        onPaste={onPasteB}
      />
    </div>
  );
}
