export type DiffKind = "same" | "changed" | "missing" | "extra" | "type_mismatch";

export type DiffNode = {
  path: string;
  keyLabel: string;
  kind: DiffKind;
  aValue?: unknown;
  bValue?: unknown;
  aType?: string;
  bType?: string;
  children?: DiffNode[];
  expandedByDefault?: boolean;
  hasChanges?: boolean;
  meta?: {
    matchLabel?: string;
    matchField?: string;
    nodeType?: "object" | "array" | "primitive";
  };
};

export type DiffSummary = {
  missingInB: number;
  extraInB: number;
  changedValues: number;
  typeMismatches: number;
};

export type CompareResult = {
  root: DiffNode;
  summary: DiffSummary;
  aRoot: unknown;
  bRoot: unknown;
  aIndent: number;
  bIndent: number;
};
