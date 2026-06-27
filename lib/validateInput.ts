import { load } from "js-yaml";
import { validateDuplicateKeys, type DuplicateKeyIssue } from "@/lib/duplicateKeys";

export type SupportedFormat = "json" | "yaml" | "env" | "unknown";

export type ValidationResult =
  | { valid: true; format: string; parsed: Record<string, unknown> }
  | {
      valid: false;
      format: string;
      error: string;
      line: number | null;
      errorType?: "DUPLICATE_KEYS";
      issues?: DuplicateKeyIssue[];
      recommendation?: string;
    };

function toParsedRecord(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return value as unknown as Record<string, unknown>;
  }
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return { value };
}

function lineFromPosition(text: string, position: number): number {
  if (position <= 0) return 1;
  let line = 1;
  for (let i = 0; i < text.length && i < position; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1; // \n
  }
  return line;
}

function extractJsonErrorLine(input: string, err: unknown): number | null {
  const message = err instanceof Error ? err.message : String(err);

  // Safari / some engines: "... line 3 column 12 ..."
  const lc = /\bline\s+(\d+)\s+column\s+(\d+)/i.exec(message);
  if (lc) return Number(lc[1]);

  // V8: "... at position 123"
  const pos = /\bposition\s+(\d+)\b/i.exec(message);
  if (pos) return lineFromPosition(input, Number(pos[1]));

  return null;
}

function normalizeEnvLines(input: string): Array<{ lineNumber: number; line: string }> {
  const lines = input.split(/\r?\n/);
  const out: Array<{ lineNumber: number; line: string }> = [];
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    out.push({ lineNumber: i + 1, line: trimmed });
  }
  return out;
}

export function validateInput(input: string, format: SupportedFormat): ValidationResult {
  const text = input ?? "";

  if (format === "unknown") {
    return {
      valid: false,
      format,
      error: "Unrecognised format",
      line: null,
    };
  }

  const duplicateValidation = validateDuplicateKeys(text, format);
  if (!duplicateValidation.isValid) {
    const firstIssue = duplicateValidation.issues?.[0];
    return {
      valid: false,
      format,
      error: duplicateValidation.message,
      line: firstIssue?.line ?? null,
      errorType: duplicateValidation.errorType,
      issues: duplicateValidation.issues,
      recommendation: duplicateValidation.recommendation
    };
  }

  if (format === "json") {
    try {
      const parsed = JSON.parse(text.trim());
      return { valid: true, format, parsed: toParsedRecord(parsed) };
    } catch (err) {
      const line = extractJsonErrorLine(text, err);
      const message = err instanceof Error ? err.message : "Invalid JSON";
      return { valid: false, format, error: message, line };
    }
  }

  if (format === "env") {
    const envEntries = normalizeEnvLines(text);
    if (envEntries.length === 0) {
      return { valid: false, format, error: "No KEY=VALUE entries found", line: null };
    }

    const envLineRe = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;
    const parsed: Record<string, unknown> = {};

    for (const { lineNumber, line } of envEntries) {
      const m = envLineRe.exec(line);
      if (!m) {
        return {
          valid: false,
          format,
          error: "Invalid ENV line (expected KEY=VALUE)",
          line: lineNumber,
        };
      }

      const key = m[1];
      const value = m[2] ?? "";
      parsed[key] = value;
    }

    return { valid: true, format, parsed };
  }

  if (format === "yaml") {
    try {
      const loaded = load(text);
      return { valid: true, format, parsed: toParsedRecord(loaded) };
    } catch (err) {
      const anyErr = err as unknown as { message?: unknown; mark?: { line?: number } };
      const message =
        err instanceof Error ? err.message : typeof anyErr?.message === "string" ? anyErr.message : "Invalid YAML";
      const line =
        typeof anyErr?.mark?.line === "number" ? anyErr.mark.line + 1 : null;
      return { valid: false, format, error: message, line };
    }
  }

  return { valid: false, format, error: "Unrecognised format", line: null };
}
