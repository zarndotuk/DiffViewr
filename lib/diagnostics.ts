export type DiagnosticsMode = "array-primitives" | "array-objects" | "object-keys";

export type Diagnostics = {
  mode: DiagnosticsMode;
  matchedCount: number;
  missingInB: string[];
  extraInB: string[];
};

export function makeDiagnostics(params: Diagnostics): Diagnostics {
  return {
    mode: params.mode,
    matchedCount: params.matchedCount,
    missingInB: params.missingInB,
    extraInB: params.extraInB
  };
}
