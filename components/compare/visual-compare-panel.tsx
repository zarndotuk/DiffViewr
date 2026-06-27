"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CompareResult, DiffNode, DiffKind } from "@/types/diff";
import type { ShikiTokenLine } from "@/lib/shiki/getHighlighter";
import { DiffSummaryBar } from "@/components/compare/diff-summary-bar";

function collectPaths(node: DiffNode, paths: string[] = []) {
  paths.push(node.path);
  if (node.children) node.children.forEach((c) => collectPaths(c, paths));
  return paths;
}

function formatValue(value: unknown) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return String(value);
}

function buildKindMaps(root: DiffNode) {
  const aMap = new Map<string, DiffKind>();
  const bMap = new Map<string, DiffKind>();
  function walk(node: DiffNode) {
    const isLeaf = !node.children || node.children.length === 0;
    if (isLeaf) {
      if (node.kind === "missing") aMap.set(node.path, "missing");
      if (node.kind === "extra") bMap.set(node.path, "extra");
      if (node.kind === "changed") {
        aMap.set(node.path, "changed");
        bMap.set(node.path, "changed");
      }
      if (node.kind === "type_mismatch") {
        aMap.set(node.path, "type_mismatch");
        bMap.set(node.path, "type_mismatch");
      }
    }
    if (node.children) node.children.forEach(walk);
  }
  walk(root);
  return { aMap, bMap };
}

function kindClass(kind?: DiffKind) {
  switch (kind) {
    case "missing":
      return "json-line missing border-l-2 border-red-400/60";
    case "extra":
      return "json-line extra border-l-2 border-emerald-400/60";
    case "changed":
      return "json-line changed border-l-2 border-amber-400/60";
    case "type_mismatch":
      return "json-line mismatch";
    default:
      return "json-line same";
  }
}

type LinePair = {
  aText: string;
  bText: string;
  aPath?: string;
  bPath?: string;
  aStatus?: DiffKind;
  bStatus?: DiffKind;
};

type RenderLine = {
  text: string;
  path?: string;
  depth: number;
};

function isPrimitive(value: unknown) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function hasOwn(obj: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function indentOf(indentSize: number, depth: number) {
  return " ".repeat(indentSize * depth);
}

function replaceBasePath(path: string | undefined, fromBase: string, toBase: string) {
  if (!path) return path;
  if (fromBase === toBase) return path;
  if (path === fromBase) return toBase;
  if (path.startsWith(fromBase)) return `${toBase}${path.slice(fromBase.length)}`;
  return path;
}

function primitiveKey(value: unknown) {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
      return `s:${value}`;
    case "number":
      return `n:${value}`;
    case "boolean":
      return `b:${value}`;
    default:
      return `x:${String(value)}`;
  }
}

type ArrayOp =
  | { kind: "both"; aIdx: number; bIdx: number }
  | { kind: "aOnly"; aIdx: number }
  | { kind: "bOnly"; bIdx: number };

function alignPrimitiveArrays(a: unknown[], b: unknown[]): ArrayOp[] | null {
  const n = a.length;
  const m = b.length;
  const maxCells = 20000;
  if (n * m > maxCells) return null;

  const aKeys = a.map(primitiveKey);
  const bKeys = b.map(primitiveKey);

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] =
        aKeys[i] === bKeys[j]
          ? 1 + dp[i + 1][j + 1]
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: ArrayOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aKeys[i] === bKeys[j]) {
      ops.push({ kind: "both", aIdx: i, bIdx: j });
      i += 1;
      j += 1;
      continue;
    }
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ kind: "aOnly", aIdx: i });
      i += 1;
    } else {
      ops.push({ kind: "bOnly", bIdx: j });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ kind: "aOnly", aIdx: i });
    i += 1;
  }
  while (j < m) {
    ops.push({ kind: "bOnly", bIdx: j });
    j += 1;
  }

  return ops;
}

type ActiveDiffKind = Exclude<DiffKind, "same">;
const ROW_HEIGHT = 27;
const VIRTUAL_OVERSCAN = 24;
const TRAILING_EDITOR_LINES = 1;

function diffKindPriority(kind?: DiffKind) {
  switch (kind) {
    case "type_mismatch":
      return 4;
    case "changed":
      return 3;
    case "missing":
      return 2;
    case "extra":
      return 1;
    default:
      return 0;
  }
}

function mergeKind(a?: DiffKind, b?: DiffKind) {
  return diffKindPriority(a) >= diffKindPriority(b) ? a : b;
}

function renderSingle(
  value: unknown,
  path: string,
  depth: number,
  indentSize: number,
  wrap = true
): RenderLine[] {
  const indent = indentOf(indentSize, depth);
  if (Array.isArray(value)) {
    const lines: RenderLine[] = wrap
      ? [{ text: `${indent}[`, path, depth }]
      : [];
    value.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      if (isPrimitive(item)) {
        lines.push({
          text: `${indentOf(indentSize, depth + 1)}${formatValue(item)}${
            index < value.length - 1 ? "," : ""
          }`,
          path: itemPath,
          depth: depth + 1
        });
      } else {
        const child = renderSingle(item, itemPath, depth + 1, indentSize, true);
        const last = child.length - 1;
        child[last] = {
          text: `${child[last].text}${index < value.length - 1 ? "," : ""}`,
          path: child[last].path,
          depth: child[last].depth
        };
        lines.push(...child);
      }
    });
    if (wrap) lines.push({ text: `${indent}]`, path, depth });
    return lines;
  }
  if (value && typeof value === "object") {
    const lines: RenderLine[] = wrap
      ? [{ text: `${indent}{`, path, depth }]
      : [];
    const keys = Object.keys(value as Record<string, unknown>);
    keys.forEach((k, idx) => {
      const childPath = path === "$" ? `$.${k}` : `${path}.${k}`;
      const v = (value as Record<string, unknown>)[k];
      if (isPrimitive(v)) {
        lines.push({
          text: `${indentOf(indentSize, depth + 1)}"${k}": ${formatValue(v)}${
            idx < keys.length - 1 ? "," : ""
          }`,
          path: childPath,
          depth: depth + 1
        });
      } else {
        const open = `${indentOf(indentSize, depth + 1)}"${k}": ${
          Array.isArray(v) ? "[" : "{"
        }`;
        lines.push({ text: open, path: childPath, depth: depth + 1 });
        const child = renderSingle(v, childPath, depth + 2, indentSize, true);
        lines.push(...child);
        lines.push({
          text: `${indentOf(indentSize, depth + 1)}${
            Array.isArray(v) ? "]" : "}"
          }${idx < keys.length - 1 ? "," : ""}`,
          path: childPath,
          depth: depth + 1
        });
      }
    });
    if (wrap) lines.push({ text: `${indent}}`, path, depth });
    return lines;
  }
  return [{ text: `${indent}${formatValue(value)}`, path, depth }];
}

function renderAligned(
  aValue: unknown,
  bValue: unknown,
  aPathBase: string,
  bPathBase: string,
  depth: number,
  lines: LinePair[],
  aIndent: number,
  bIndent: number,
  wrap = true
) {
  if (aValue === undefined && bValue === undefined) return;
  const aExists = aValue !== undefined;
  const bExists = bValue !== undefined;
  const aIsArr = Array.isArray(aValue);
  const bIsArr = Array.isArray(bValue);
  const aIsObj = aValue && typeof aValue === "object" && !Array.isArray(aValue);
  const bIsObj = bValue && typeof bValue === "object" && !Array.isArray(bValue);

  if (aExists && !bExists) {
    const aLines = renderSingle(aValue, aPathBase, depth, aIndent, wrap);
    aLines.forEach((l) => {
      const bPath = replaceBasePath(l.path, aPathBase, bPathBase);
      lines.push({
        aText: l.text,
        bText: indentOf(bIndent, l.depth),
        aPath: l.path,
        bPath,
        bStatus: "missing"
      });
    });
    return;
  }
  if (!aExists && bExists) {
    const bLines = renderSingle(bValue, bPathBase, depth, bIndent, wrap);
    bLines.forEach((l) => {
      const aPath = replaceBasePath(l.path, bPathBase, aPathBase);
      lines.push({
        aText: indentOf(aIndent, l.depth),
        bText: l.text,
        aPath,
        bPath: l.path,
        aStatus: "missing",
        bStatus: "extra"
      });
    });
    return;
  }

  if (aIsArr && bIsArr) {
    const indentA = indentOf(aIndent, depth);
    const indentB = indentOf(bIndent, depth);
    if (wrap) {
      lines.push({
        aText: `${indentA}[`,
        bText: `${indentB}[`,
        aPath: aPathBase,
        bPath: bPathBase
      });
    }

    const aArr = aValue as unknown[];
    const bArr = bValue as unknown[];
    const aPrim = aArr.every(isPrimitive);
    const bPrim = bArr.every(isPrimitive);
    const alignedOps = aPrim && bPrim ? alignPrimitiveArrays(aArr, bArr) : null;

      if (alignedOps) {
        let visualIndex = 0;
        for (let opIndex = 0; opIndex < alignedOps.length; opIndex += 1) {
          const op = alignedOps[opIndex];
          const before = lines.length;

          if (op.kind === "aOnly" && alignedOps[opIndex + 1]?.kind === "bOnly") {
            const next = alignedOps[opIndex + 1] as { kind: "bOnly"; bIdx: number };
            const aItem = aArr[op.aIdx];
            const bItem = bArr[next.bIdx];
            const aItemPath = `${aPathBase}[${op.aIdx}]`;
            const bItemPath = `${bPathBase}[${next.bIdx}]`;
            const aComma = op.aIdx < aArr.length - 1 ? "," : "";
            const bComma = next.bIdx < bArr.length - 1 ? "," : "";

            lines.push({
              aText: `${indentOf(aIndent, depth + 1)}${formatValue(aItem)}${aComma}`,
              bText: `${indentOf(bIndent, depth + 1)}${formatValue(bItem)}${bComma}`,
              aPath: aItemPath,
              bPath: bItemPath,
              aStatus: "changed",
              bStatus: "changed"
            });

            visualIndex += 1;
            opIndex += 1; // consume the paired bOnly op
            continue;
          }

          if (op.kind === "both") {
            const aItem = aArr[op.aIdx];
            const bItem = bArr[op.bIdx];
            const aItemPath = `${aPathBase}[${op.aIdx}]`;
            const bItemPath = `${bPathBase}[${op.bIdx}]`;
            renderAligned(aItem, bItem, aItemPath, bItemPath, depth + 1, lines, aIndent, bIndent, true);
            const lastIdx = lines.length - 1;
            if (lines.length > before) {
              if (op.aIdx < aArr.length - 1) lines[lastIdx].aText = `${lines[lastIdx].aText},`;
              if (op.bIdx < bArr.length - 1) lines[lastIdx].bText = `${lines[lastIdx].bText},`;
            }
            visualIndex += 1;
            continue;
          }

        if (op.kind === "aOnly") {
          const aItem = aArr[op.aIdx];
          const aItemPath = `${aPathBase}[${op.aIdx}]`;
          const bItemPath = `${bPathBase}[${visualIndex}]`;
          renderAligned(aItem, undefined, aItemPath, bItemPath, depth + 1, lines, aIndent, bIndent, true);
          const lastIdx = lines.length - 1;
          if (lines.length > before && op.aIdx < aArr.length - 1) {
            lines[lastIdx].aText = `${lines[lastIdx].aText},`;
          }
          visualIndex += 1;
          continue;
        }

        const bItem = bArr[op.bIdx];
        const aItemPath = `${aPathBase}[${visualIndex}]`;
        const bItemPath = `${bPathBase}[${op.bIdx}]`;
        renderAligned(undefined, bItem, aItemPath, bItemPath, depth + 1, lines, aIndent, bIndent, true);
        const lastIdx = lines.length - 1;
        if (lines.length > before && op.bIdx < bArr.length - 1) {
          lines[lastIdx].bText = `${lines[lastIdx].bText},`;
        }
        visualIndex += 1;
      }
    } else {
      const maxLen = Math.max(aArr.length, bArr.length);
      for (let i = 0; i < maxLen; i += 1) {
        const aItem = aArr[i];
        const bItem = bArr[i];
        const aItemPath = `${aPathBase}[${i}]`;
        const bItemPath = `${bPathBase}[${i}]`;
        const before = lines.length;
        renderAligned(aItem, bItem, aItemPath, bItemPath, depth + 1, lines, aIndent, bIndent, true);
        const lastIdx = lines.length - 1;
        if (lines.length > before) {
          if (aItem !== undefined && i < aArr.length - 1) lines[lastIdx].aText = `${lines[lastIdx].aText},`;
          if (bItem !== undefined && i < bArr.length - 1) lines[lastIdx].bText = `${lines[lastIdx].bText},`;
        }
      }
    }
    if (wrap) {
      lines.push({
        aText: `${indentA}]`,
        bText: `${indentB}]`,
        aPath: aPathBase,
        bPath: bPathBase
      });
    }
    return;
  }

  if (aIsObj && bIsObj) {
    const indentA = indentOf(aIndent, depth);
    const indentB = indentOf(bIndent, depth);
    if (wrap) {
      lines.push({
        aText: `${indentA}{`,
        bText: `${indentB}{`,
        aPath: aPathBase,
        bPath: bPathBase
      });
    }
    const aObj = aValue as Record<string, unknown>;
    const bObj = bValue as Record<string, unknown>;
    const keys = [...Object.keys(aObj), ...Object.keys(bObj).filter((k) => !(k in aObj))];

    function renderPropertySingle(
      value: unknown,
      key: string,
      childPath: string,
      parentDepth: number,
      indentSize: number
    ): RenderLine[] {
      const propDepth = parentDepth + 1;
      const propIndent = indentOf(indentSize, propDepth);

      if (isPrimitive(value)) {
        return [
          {
            text: `${propIndent}"${key}": ${formatValue(value)}`,
            path: childPath,
            depth: propDepth
          }
        ];
      }

      const isArr = Array.isArray(value);
      const openChar = isArr ? "[" : "{";
      const closeChar = isArr ? "]" : "}";

      const open: RenderLine = {
        text: `${propIndent}"${key}": ${openChar}`,
        path: childPath,
        depth: propDepth
      };
      const inner = renderSingle(value, childPath, propDepth, indentSize, false);
      const close: RenderLine = {
        text: `${propIndent}${closeChar}`,
        path: childPath,
        depth: propDepth
      };
      return [open, ...inner, close];
    }

    keys.forEach((k, idx) => {
      const aChildPath = aPathBase === "$" ? `$.${k}` : `${aPathBase}.${k}`;
      const bChildPath = bPathBase === "$" ? `$.${k}` : `${bPathBase}.${k}`;
      const aHas = hasOwn(aObj, k);
      const bHas = hasOwn(bObj, k);
      const comma = idx < keys.length - 1;
      const aChild = aHas ? aObj[k] : undefined;
      const bChild = bHas ? bObj[k] : undefined;

      if (aHas && bHas) {
        const aPrim = isPrimitive(aChild);
        const bPrim = isPrimitive(bChild);
        if (aPrim && bPrim) {
          lines.push({
            aText: `${indentOf(aIndent, depth + 1)}"${k}": ${formatValue(aChild)}${comma ? "," : ""}`,
            bText: `${indentOf(bIndent, depth + 1)}"${k}": ${formatValue(bChild)}${comma ? "," : ""}`,
            aPath: aChildPath,
            bPath: bChildPath
          });
          return;
        }

        if (!aPrim && !bPrim && Array.isArray(aChild) === Array.isArray(bChild)) {
          lines.push({
            aText: `${indentOf(aIndent, depth + 1)}"${k}": ${Array.isArray(aChild) ? "[" : "{"}`,
            bText: `${indentOf(bIndent, depth + 1)}"${k}": ${Array.isArray(bChild) ? "[" : "{"}`,
            aPath: aChildPath,
            bPath: bChildPath
          });
          renderAligned(aChild, bChild, aChildPath, bChildPath, depth + 1, lines, aIndent, bIndent, false);
          lines.push({
            aText: `${indentOf(aIndent, depth + 1)}${Array.isArray(aChild) ? "]" : "}"}${comma ? "," : ""}`,
            bText: `${indentOf(bIndent, depth + 1)}${Array.isArray(bChild) ? "]" : "}"}${comma ? "," : ""}`,
            aPath: aChildPath,
            bPath: bChildPath
          });
          return;
        }

        const aRendered = renderPropertySingle(aChild, k, aChildPath, depth, aIndent);
        const bRendered = renderPropertySingle(bChild, k, bChildPath, depth, bIndent);
        if (comma) {
          aRendered[aRendered.length - 1].text = `${aRendered[aRendered.length - 1].text},`;
          bRendered[bRendered.length - 1].text = `${bRendered[bRendered.length - 1].text},`;
        }
        const maxLen = Math.max(aRendered.length, bRendered.length);
        for (let i = 0; i < maxLen; i += 1) {
          const aLine = aRendered[i];
          const bLine = bRendered[i];
          const fallbackDepth = depth + 1;
          const aDepth = aLine?.depth ?? bLine?.depth ?? fallbackDepth;
          const bDepth = bLine?.depth ?? aLine?.depth ?? fallbackDepth;
          lines.push({
            aText: aLine ? aLine.text : indentOf(aIndent, aDepth),
            bText: bLine ? bLine.text : indentOf(bIndent, bDepth),
            aPath: aLine?.path ?? aChildPath,
            bPath: bLine?.path ?? bChildPath
          });
        }
        return;
      }

      if (aHas && !bHas) {
        if (isPrimitive(aChild)) {
          lines.push({
            aText: `${indentOf(aIndent, depth + 1)}"${k}": ${formatValue(aChild)}${comma ? "," : ""}`,
            bText: indentOf(bIndent, depth + 1),
            aPath: aChildPath,
            bPath: bChildPath,
            bStatus: "missing"
          });
          return;
        }

        lines.push({
          aText: `${indentOf(aIndent, depth + 1)}"${k}": ${Array.isArray(aChild) ? "[" : "{"}`,
          bText: indentOf(bIndent, depth + 1),
          aPath: aChildPath,
          bPath: bChildPath,
          bStatus: "missing"
        });
        renderAligned(aChild, undefined, aChildPath, bChildPath, depth + 1, lines, aIndent, bIndent, false);
        lines.push({
          aText: `${indentOf(aIndent, depth + 1)}${Array.isArray(aChild) ? "]" : "}"}${comma ? "," : ""}`,
          bText: indentOf(bIndent, depth + 1),
          aPath: aChildPath,
          bPath: bChildPath,
          bStatus: "missing"
        });
        return;
      }

      if (!aHas && bHas) {
        if (isPrimitive(bChild)) {
          lines.push({
            aText: indentOf(aIndent, depth + 1),
            bText: `${indentOf(bIndent, depth + 1)}"${k}": ${formatValue(bChild)}${comma ? "," : ""}`,
            aPath: aChildPath,
            bPath: bChildPath,
            aStatus: "missing",
            bStatus: "extra"
          });
          return;
        }

        lines.push({
          aText: indentOf(aIndent, depth + 1),
          bText: `${indentOf(bIndent, depth + 1)}"${k}": ${Array.isArray(bChild) ? "[" : "{"}`,
          aPath: aChildPath,
          bPath: bChildPath,
          aStatus: "missing",
          bStatus: "extra"
        });
        renderAligned(undefined, bChild, aChildPath, bChildPath, depth + 1, lines, aIndent, bIndent, false);
        lines.push({
          aText: indentOf(aIndent, depth + 1),
          bText: `${indentOf(bIndent, depth + 1)}${Array.isArray(bChild) ? "]" : "}"}${comma ? "," : ""}`,
          aPath: aChildPath,
          bPath: bChildPath,
          aStatus: "missing",
          bStatus: "extra"
        });
      }
    });
    if (wrap) {
      lines.push({
        aText: `${indentA}}`,
        bText: `${indentB}}`,
        aPath: aPathBase,
        bPath: bPathBase
      });
    }
    return;
  }

  const indentA = indentOf(aIndent, depth);
  const indentB = indentOf(bIndent, depth);
  lines.push({
    aText: `${indentA}${formatValue(aValue)}`,
    bText: `${indentB}${formatValue(bValue)}`,
    aPath: aPathBase,
    bPath: bPathBase
  });
}

export function VisualComparePanel({ result }: { result: CompareResult }) {
  const [mobilePane, setMobilePane] = useState<"a" | "b">("a");
  const { aMap, bMap } = useMemo(() => buildKindMaps(result.root), [result.root]);
  const aligned = useMemo(() => {
    const lines: LinePair[] = [];
    renderAligned(result.aRoot, result.bRoot, "$", "$", 0, lines, result.aIndent, result.bIndent);
    return lines;
  }, [result.aRoot, result.bRoot, result.aIndent, result.bIndent]);
  const paneContentWidths = useMemo(() => {
    const longest = aligned.reduce(
      (current, line) => ({
        a: Math.max(current.a, line.aText.length),
        b: Math.max(current.b, line.bText.length)
      }),
      { a: 0, b: 0 }
    );
    const contentWidth = (lineLength: number) =>
      `max(100%, ${Math.min(Math.max(lineLength + 10, 50), 260)}ch)`;

    return {
      a: contentWidth(longest.a),
      b: contentWidth(longest.b)
    };
  }, [aligned]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(640);

  const inferAForLine = useCallback(
    (line: LinePair) =>
      (line.aStatus ? line.aStatus : line.aPath ? aMap.get(line.aPath) : undefined) as DiffKind | undefined,
    [aMap]
  );
  const inferBForLine = useCallback(
    (line: LinePair) =>
      (line.bStatus ? line.bStatus : line.bPath ? bMap.get(line.bPath) : undefined) as DiffKind | undefined,
    [bMap]
  );

  const inferBetweenKind = useCallback(
    (line: LinePair): DiffKind | undefined => {
      if (line.bStatus === "missing") return "missing";
      if (line.bStatus === "extra") return "extra";
      if (line.aStatus === "missing") return "missing";
      return mergeKind(inferAForLine(line), inferBForLine(line));
    },
    [inferAForLine, inferBForLine]
  );

  const aCode = useMemo(() => aligned.map((l) => l.aText).join("\n"), [aligned]);
  const bCode = useMemo(() => aligned.map((l) => l.bText).join("\n"), [aligned]);

  const shouldHighlight = useMemo(() => {
    const totalChars = aCode.length + bCode.length;
    return aligned.length <= 3000 && totalChars <= 600_000;
  }, [aligned.length, aCode, bCode]);

  const [aTokens, setATokens] = useState<ShikiTokenLine[] | null>(null);
  const [bTokens, setBTokens] = useState<ShikiTokenLine[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setATokens(null);
    setBTokens(null);
    if (!shouldHighlight) return () => {
      cancelled = true;
    };

    (async () => {
      try {
        const { shikiTokenizeLines } = await import("@/lib/shiki/getHighlighter");
        const [nextA, nextB] = await Promise.all([
          shikiTokenizeLines({ code: aCode, lang: "json" }),
          shikiTokenizeLines({ code: bCode, lang: "json" })
        ]);
        if (cancelled) return;
        setATokens(nextA);
        setBTokens(nextB);
      } catch {
        // Best-effort highlighting only.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [aCode, bCode, shouldHighlight]);

  const [activeChangePos, setActiveChangePos] = useState(0);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveDiffKind[]>([
    "missing",
    "extra",
    "changed",
    "type_mismatch"
  ]);
  const activeFilterSet = useMemo(() => new Set<ActiveDiffKind>(activeFilters), [activeFilters]);

  const toggleFilter = useCallback((kind: ActiveDiffKind) => {
    setActiveFilters((current) =>
      current.includes(kind)
        ? current.filter((item) => item !== kind)
        : [...current, kind]
    );
  }, []);

  const isVisibleLine = useCallback(
    (line: LinePair) => {
      const kind = inferBetweenKind(line);
      return !kind || kind === "same" || activeFilterSet.has(kind as ActiveDiffKind);
    },
    [activeFilterSet, inferBetweenKind]
  );

  const visibleLineIndices = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < aligned.length; i += 1) {
      if (isVisibleLine(aligned[i])) out.push(i);
    }
    return out;
  }, [aligned, isVisibleLine]);

  const changeLineIndices = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < aligned.length; i += 1) {
      const kind = inferBetweenKind(aligned[i]);
      if (kind && kind !== "same" && activeFilterSet.has(kind as ActiveDiffKind)) out.push(i);
    }
    return out;
}, [activeFilterSet, aligned, inferBetweenKind]);

  useEffect(() => {
    if (changeLineIndices.length === 0) {
      setActiveChangePos(0);
      setActiveLine(null);
      return;
    }
    const pos = Math.min(activeChangePos, changeLineIndices.length - 1);
    setActiveChangePos(pos);
    setActiveLine(changeLineIndices[pos] ?? null);
  }, [activeChangePos, changeLineIndices]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateHeight = () => setViewportHeight(element.clientHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const virtualWindow = useMemo(() => {
    const start = Math.max(
      0,
      Math.floor(scrollTop / ROW_HEIGHT) - VIRTUAL_OVERSCAN
    );
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT);
    const end = Math.min(
      visibleLineIndices.length,
      start + visibleCount + VIRTUAL_OVERSCAN * 2
    );
    return visibleLineIndices
      .slice(start, end)
      .map((lineIndex, offset) => ({
        lineIndex,
        visiblePosition: start + offset
      }));
  }, [scrollTop, viewportHeight, visibleLineIndices]);

  const editorHeight = (visibleLineIndices.length + TRAILING_EDITOR_LINES) * ROW_HEIGHT;

  const goToChange = useCallback((pos: number) => {
    if (pos < 0 || pos >= changeLineIndices.length) return;
    setActiveChangePos(pos);
    const lineIdx = changeLineIndices[pos];
    setActiveLine(lineIdx);
    const visiblePosition = visibleLineIndices.indexOf(lineIdx);
    if (visiblePosition >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: Math.max(
          0,
          visiblePosition * ROW_HEIGHT -
            scrollRef.current.clientHeight / 2 +
            ROW_HEIGHT / 2
        ),
        behavior: "smooth"
      });
    }
  }, [changeLineIndices, visibleLineIndices]);

  function renderTokenLine(tokens: ShikiTokenLine | undefined, fallbackText: string) {
    if (!tokens) return <span className="json-code whitespace-pre">{fallbackText}</span>;
    return (
      <span className="json-code">
        {tokens.map((t, i) => (
          <span key={i} style={t.color ? { color: t.color } : undefined}>
            {t.content}
          </span>
        ))}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <DiffSummaryBar
        summary={result.summary}
        activeFilters={activeFilterSet}
        onToggleFilter={toggleFilter}
      />
      <div className="grid grid-cols-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-1 md:hidden">
        <button
          type="button"
          className={`min-h-11 rounded-md px-3 font-mono text-[12px] font-medium transition-colors ${
            mobilePane === "a"
              ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--text)]"
              : "text-[var(--muted)]"
          }`}
          aria-pressed={mobilePane === "a"}
          onClick={() => setMobilePane("a")}
        >
          Template A
        </button>
        <button
          type="button"
          className={`min-h-11 rounded-md px-3 font-mono text-[12px] font-medium transition-colors ${
            mobilePane === "b"
              ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--text)]"
              : "text-[var(--muted)]"
          }`}
          aria-pressed={mobilePane === "b"}
          onClick={() => setMobilePane("b")}
        >
          Aligned B
        </button>
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          className="max-h-[70vh] min-h-[360px] w-full overflow-auto rounded-xl border border-[var(--border)]"
        >
          <div className="flex w-full min-w-0 gap-0 md:gap-3">
          <div className={`${mobilePane === "a" ? "block" : "hidden"} min-w-0 flex-1 basis-0 overflow-x-auto md:block`}>
            <div style={{ minWidth: paneContentWidths.a }}>
              <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_75%,transparent)] px-3 py-2 text-xs uppercase text-[var(--muted)]">
                Template (A)
              </div>
              <div
                className="json-view relative w-full"
                style={{ height: editorHeight }}
              >
                {virtualWindow.map(({ lineIndex: idx, visiblePosition }) => {
                  const line = aligned[idx];
                  const inferred = line.aStatus
                    ? line.aStatus
                    : line.aPath
                      ? aMap.get(line.aPath)
                      : undefined;
                  const isActive = activeLine === idx;
                  return (
                    <div
                      key={`a-${idx}`}
                      className={`${kindClass(inferred)} json-editor-line absolute left-0 right-0 ${isActive ? "json-line-active" : ""}`}
                      style={{
                        height: ROW_HEIGHT,
                        transform: `translateY(${visiblePosition * ROW_HEIGHT}px)`
                      }}
                    >
                      <span className="json-lineno" aria-hidden="true">
                        {idx + 1}
                      </span>
                      {renderTokenLine(aTokens?.[idx], line.aText)}
                    </div>
                  );
                })}
                <div
                  className="json-line same json-editor-line absolute left-0 right-0"
                  style={{
                    height: ROW_HEIGHT,
                    transform: `translateY(${visibleLineIndices.length * ROW_HEIGHT}px)`
                  }}
                  aria-hidden="true"
                >
                  <span className="json-lineno">&nbsp;</span>
                  <span className="json-code whitespace-pre">&nbsp;</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`${mobilePane === "b" ? "block" : "hidden"} min-w-0 flex-1 basis-0 overflow-x-auto md:block`}>
            <div style={{ minWidth: paneContentWidths.b }}>
              <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_75%,transparent)] px-3 py-2 text-xs uppercase text-[var(--muted)]">
                Aligned (B)
              </div>
              <div
                className="json-view relative w-full"
                style={{ height: editorHeight }}
              >
                {virtualWindow.map(({ lineIndex: idx, visiblePosition }) => {
                  const line = aligned[idx];
                  const inferred = line.bStatus
                    ? line.bStatus
                    : line.bPath
                      ? bMap.get(line.bPath)
                      : undefined;
                  const isActive = activeLine === idx;
                  return (
                    <div
                      key={`b-${idx}`}
                      className={`${kindClass(inferred)} json-editor-line absolute left-0 right-0 ${isActive ? "json-line-active" : ""}`}
                      style={{
                        height: ROW_HEIGHT,
                        transform: `translateY(${visiblePosition * ROW_HEIGHT}px)`
                      }}
                    >
                      <span className="json-lineno" aria-hidden="true">
                        {idx + 1}
                      </span>
                      {renderTokenLine(bTokens?.[idx], line.bText)}
                    </div>
                  );
                })}
                <div
                  className="json-line same json-editor-line absolute left-0 right-0"
                  style={{
                    height: ROW_HEIGHT,
                    transform: `translateY(${visibleLineIndices.length * ROW_HEIGHT}px)`
                  }}
                  aria-hidden="true"
                >
                  <span className="json-lineno">&nbsp;</span>
                  <span className="json-code whitespace-pre">&nbsp;</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

       {changeLineIndices.length > 0 && (
         <div className="mobile-change-nav absolute bottom-3 left-1/2 z-30 flex w-[calc(100%_-_2rem)] max-w-sm -translate-x-1/2 items-center justify-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[var(--panel)] px-0.5 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.28)] sm:bottom-6 sm:w-fit sm:max-w-none">
           <button
             type="button"
             className="flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[12px] text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] hover:text-[var(--text)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
             onClick={() => goToChange(activeChangePos - 1)}
             disabled={activeChangePos <= 0}
             aria-label="Previous change"
           >
             ← Prev
           </button>
           <span className="font-mono text-[12px] text-[var(--muted)] px-2 border-x border-[var(--border)]">
             {activeChangePos + 1} / {changeLineIndices.length}
           </span>
           <button
             type="button"
             className="flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[12px] text-[var(--text)] font-medium hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
             onClick={() => goToChange(activeChangePos + 1)}
             disabled={activeChangePos >= changeLineIndices.length - 1}
             aria-label="Next change"
           >
             Next →
           </button>
         </div>
       )}
       </div>
     </div>
   );
 }
