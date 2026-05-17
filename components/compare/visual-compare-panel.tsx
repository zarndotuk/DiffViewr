"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CompareResult, DiffNode, DiffKind } from "@/lib/diff/types";
import { shikiTokenizeLinesForMode, type ShikiTokenLine } from "@/lib/shiki/getHighlighter";
import { DiffSummaryBar } from "@/components/compare/diff-summary-bar";
import { DiffLegend } from "@/components/compare/diff-legend";

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
      return "json-line missing";
    case "extra":
      return "json-line extra";
    case "changed":
      return "json-line changed";
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

type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

type ResolvedTheme = "light" | "dark";

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

function diffKindColor(kind?: DiffKind) {
  switch (kind) {
    case "missing":
      return "var(--danger)";
    case "extra":
      return "var(--ok)";
    case "changed":
      return "var(--warn)";
    case "type_mismatch":
      return "color-mix(in srgb, var(--danger) 85%, var(--accent))";
    default:
      return "transparent";
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
  const { aMap, bMap } = useMemo(() => buildKindMaps(result.root), [result.root]);
  const aligned = useMemo(() => {
    const lines: LinePair[] = [];
    renderAligned(result.aRoot, result.bRoot, "$", "$", 0, lines, result.aIndent, result.bIndent);
    return lines;
  }, [result.aRoot, result.bRoot, result.aIndent, result.bIndent]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>({ scrollTop: 0, scrollHeight: 1, clientHeight: 1 });

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

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const read = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setResolvedTheme(t === "light" ? "light" : "dark");
    };

    read();
    const mo = new MutationObserver(() => read());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

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
        const [nextA, nextB] = await Promise.all([
          shikiTokenizeLinesForMode({ code: aCode, mode: resolvedTheme }),
          shikiTokenizeLinesForMode({ code: bCode, mode: resolvedTheme })
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
  }, [aCode, bCode, shouldHighlight, resolvedTheme]);

  const [activeChangePos, setActiveChangePos] = useState(0);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    rowRefs.current = new Array(aligned.length).fill(null);
  }, [aligned.length]);

  const changeLineIndices = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < aligned.length; i += 1) {
      const kind = inferBetweenKind(aligned[i]);
      if (kind && kind !== "same") out.push(i);
    }
    return out;
}, [aligned, inferBetweenKind]);

  useEffect(() => {
    if (changeLineIndices.length === 0) {
      setActiveChangePos(0);
      setActiveLine(null);
      return;
    }
    const pos = Math.min(activeChangePos, changeLineIndices.length - 1);
    setActiveChangePos(pos);
    setActiveLine(changeLineIndices[pos] ?? null);
  }, [changeLineIndices]);

  const goToChange = useCallback((pos: number) => {
    if (pos < 0 || pos >= changeLineIndices.length) return;
    setActiveChangePos(pos);
    const lineIdx = changeLineIndices[pos];
    setActiveLine(lineIdx);
    const el = rowRefs.current[lineIdx];
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}, [changeLineIndices]);

  const gutter = useMemo(() => {
    const changeSet = new Set(changeLineIndices);
    return (
      <div
        className="py-[10px] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)]"
        style={{ fontFamily: "var(--mono)", fontSize: 14, lineHeight: 1.6 }}
      >
        {aligned.map((line, idx) => {
          const isChange = changeSet.has(idx);
          const kind = isChange ? inferBetweenKind(line) : undefined;
          const color = diffKindColor(kind);
          return (
            <div key={`g-${idx}`} className="relative flex items-center justify-center py-[2px]">
              <span className="text-transparent select-none" aria-hidden="true">
                .
              </span>
              {isChange ? (
                <div
                  className="absolute w-[6px] h-[12px] rounded-md"
                  style={{ background: color }}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }, [aligned, inferBetweenKind, changeLineIndices]);

  const scrollbar = useMemo(() => {
    const clientHeight = metrics.clientHeight || 1;
    const totalLines = Math.max(1, aligned.length);

    const bucketCount = Math.min(260, Math.max(24, Math.floor(clientHeight / 2)));
    const buckets: { a?: DiffKind; b?: DiffKind }[] = Array.from({ length: bucketCount }, () => ({}));

    for (let i = 0; i < aligned.length; i += 1) {
      const bucket = Math.min(bucketCount - 1, Math.floor((i / totalLines) * bucketCount));
      const aKind = inferAForLine(aligned[i]);
      const bKind = inferBForLine(aligned[i]);
      if (diffKindPriority(aKind) > diffKindPriority(buckets[bucket].a)) buckets[bucket].a = aKind;
      if (diffKindPriority(bKind) > diffKindPriority(buckets[bucket].b)) buckets[bucket].b = bKind;
    }

    const viewportTop = (metrics.scrollTop / (metrics.scrollHeight || 1)) * clientHeight;
    const viewportHeight = (clientHeight / (metrics.scrollHeight || 1)) * clientHeight;

    return (
      <div className="relative w-[14px]">
        <div className="sticky top-0 h-full">
          <div className="relative h-full rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_65%,transparent)] overflow-hidden">
            {buckets.map((b, i) => {
              const top = Math.round((i / bucketCount) * clientHeight);
              const height = Math.max(1, Math.round(clientHeight / bucketCount));
              const aColor = diffKindColor(b.a);
              const bColor = diffKindColor(b.b);
              if (aColor === "transparent" && bColor === "transparent") return null;
              return (
                <div key={i} className="absolute left-0 right-0" style={{ top, height }}>
                  <div className="flex h-full">
                    <div className="w-1/2 h-full" style={{ background: aColor }} />
                    <div className="w-1/2 h-full" style={{ background: bColor }} />
                  </div>
                </div>
              );
            })}
            <div
              className="absolute left-0 right-0 rounded-sm border border-[color-mix(in_srgb,var(--accent)_55%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
              style={{
                top: Math.max(0, Math.min(clientHeight - 2, viewportTop)),
                height: Math.max(8, Math.min(clientHeight, viewportHeight))
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    );
  }, [metrics, aligned, inferAForLine, inferBForLine]);

  const buttonBase =
    "px-3 py-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] text-sm hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-60 disabled:cursor-not-allowed";

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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img
            src="/brand/diffviewr-logo.svg"
            width={18}
            height={18}
            className="w-[18px] h-[18px]"
            alt=""
            aria-hidden="true"
            loading="eager"
          />
          <div className="text-sm font-semibold text-[var(--text)]">
            Visual Compare
            <span className="ml-2 text-[14px] font-normal text-[var(--muted)]">
              DiffViewr (local-only)
            </span>
          </div>
        </div>
      </div>
      <DiffSummaryBar summary={result.summary} />
      <DiffLegend />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[14px] text-[var(--muted)]">
          {changeLineIndices.length ? (
            <span>
              Change {activeChangePos + 1} / {changeLineIndices.length}
            </span>
          ) : (
            <span>No differences</span>
          )}
          {!shouldHighlight ? (
            <span className="ml-2 opacity-80">(syntax highlighting disabled for large inputs)</span>
          ) : aTokens && bTokens ? (
            <span className="ml-2 opacity-80">(syntax highlighting: on)</span>
          ) : (
            <span className="ml-2 opacity-80">(loading syntax highlighting…)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className={buttonBase}
            onClick={() => goToChange(activeChangePos - 1)}
            type="button"
            disabled={changeLineIndices.length === 0 || activeChangePos <= 0}
          >
            Prev
          </button>
          <button
            className={buttonBase}
            onClick={() => goToChange(activeChangePos + 1)}
            type="button"
            disabled={changeLineIndices.length === 0 || activeChangePos >= changeLineIndices.length - 1}
          >
            Next
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="rounded-xl border border-[var(--border)] relative w-full overflow-visible">
        <div className="flex gap-3 min-w-[820px]">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="sticky top-0 z-10 px-3 py-2 text-xs uppercase text-[var(--muted)] border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_75%,transparent)]">
              Template (A)
            </div>
            <div className="json-view w-full">
              {aligned.map((line, idx) => {
                const inferred = line.aStatus
                  ? line.aStatus
                   : line.aPath
                     ? aMap.get(line.aPath)
                     : undefined;
                const isActive = activeLine === idx;
                return (
                  <div
                    key={`a-${idx}`}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    className={`${kindClass(inferred)} json-editor-line ${isActive ? "json-line-active" : ""}`}
                  >
                    <span className="json-lineno" aria-hidden="true">
                      {idx + 1}
                    </span>
                    {renderTokenLine(aTokens?.[idx], line.aText)}
                  </div>
                );
              })}
            </div>
</div>
           {/* <div className="flex-none w-[10px] overflow-hidden">
             <div
               className="sticky top-0 z-10 px-1 py-2 text-xs uppercase text-[var(--muted)] border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_75%,transparent)]"
               aria-hidden="true"
             >
               &nbsp;
</div>
          </div> */}
          <div className="flex-none w-[10px] overflow-hidden">
            <div
              className="sticky top-0 z-10 px-3 py-2 text-xs uppercase text-[var(--muted)] border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_75%,transparent)]"
              aria-hidden="true"
            >
              <span className="text-transparent select-none">Template</span>
            </div>
            {gutter}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="sticky top-0 z-10 px-3 py-2 text-xs uppercase text-[var(--muted)] border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_75%,transparent)]">
              Aligned (B)
            </div>
            <div className="json-view w-full">
              {aligned.map((line, idx) => {
                const inferred = line.bStatus
                  ? line.bStatus
                  : line.bPath
                    ? bMap.get(line.bPath)
                    : undefined;
                const isActive = activeLine === idx;
                return (
                  <div key={`b-${idx}`} className={`${kindClass(inferred)} json-editor-line ${isActive ? "json-line-active" : ""}`}>
                    <span className="json-lineno" aria-hidden="true">
                      {idx + 1}
                    </span>
                    {renderTokenLine(bTokens?.[idx], line.bText)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
