import { buildSummary } from "@/lib/diff/buildSummary";
import { compareJson } from "@/lib/diff/compareJson";
import { detectFormat } from "@/lib/detectFormat";
import { reorderByTemplate } from "@/lib/reorderByTemplate";
import {
  detectIndentFromText,
  stringifyLikeInput
} from "@/lib/stringifyLikeInput";
import { validateInput } from "@/lib/validateInput";
import type {
  CompareWorkerResult,
  ValidateWorkerResponse
} from "@/lib/workers/config-worker-types";

export function processValidation(id: number, input: string): ValidateWorkerResponse {
  const format = detectFormat(input);
  return {
    id,
    type: "validate",
    format,
    validation: validateInput(input, format)
  };
}

export function processComparison(
  refText: string,
  targetText: string,
  reorderArrays: boolean
): CompareWorkerResult {
  const formatA = detectFormat(refText);
  const formatB = detectFormat(targetText);
  const validationA = validateInput(refText, formatA);
  const validationB = validateInput(targetText, formatB);

  if (!validationA.valid) {
    throw new Error(`Fix Reference (A) (${formatA.toUpperCase()}) to continue.`);
  }
  if (!validationB.valid) {
    throw new Error(`Fix Target (B) (${formatB.toUpperCase()}) to continue.`);
  }

  const refJson: unknown = validationA.parsed;
  const targetJson: unknown = validationB.parsed;
  const nextRoot = reorderByTemplate(
    targetJson as Record<string, unknown>,
    refJson as Record<string, unknown>,
    reorderArrays
  );
  const resultText = stringifyLikeInput(nextRoot, targetText);
  const root = compareJson(refJson, nextRoot, "$", "$", "");

  return {
    resultText,
    targetFormat: formatB,
    validationA,
    validationB,
    compare: {
      root,
      summary: buildSummary(root),
      aRoot: refJson,
      bRoot: nextRoot,
      aIndent: detectIndentFromText(refText) ?? 2,
      bIndent: detectIndentFromText(targetText) ?? 2
    }
  };
}
