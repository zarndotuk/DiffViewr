import type { CompareResult } from "@/types/diff";
import type { SupportedFormat, ValidationResult } from "@/lib/validateInput";

export type ValidateWorkerRequest = {
  id: number;
  type: "validate";
  input: string;
};

export type CompareWorkerRequest = {
  id: number;
  type: "compare";
  refText: string;
  targetText: string;
  reorderArrays: boolean;
};

export type ConfigWorkerRequest = ValidateWorkerRequest | CompareWorkerRequest;

export type ValidateWorkerResponse = {
  id: number;
  type: "validate";
  format: SupportedFormat;
  validation: ValidationResult;
};

export type CompareWorkerResult = {
  resultText: string;
  targetFormat: SupportedFormat;
  validationA: ValidationResult;
  validationB: ValidationResult;
  compare: CompareResult;
};

export type CompareWorkerResponse = {
  id: number;
  type: "compare";
  result: CompareWorkerResult;
};

export type WorkerErrorResponse = {
  id: number;
  type: "error";
  message: string;
};

export type ConfigWorkerResponse =
  | ValidateWorkerResponse
  | CompareWorkerResponse
  | WorkerErrorResponse;
