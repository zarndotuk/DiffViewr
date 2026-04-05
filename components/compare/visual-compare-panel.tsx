"use client";

import { useMemo, useState } from "react";
import type { CompareResult, DiffNode, DiffKind } from "@/lib/diff/types";
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

function renderSingle(
  value: unknown,
  path: string,
  depth: number,
  indentSize: number,
  wrap = true
): { text: string; path?: string }[] {
  const indent = " ".repeat(indentSize * depth);
  if (Array.isArray(value)) {
    const lines: { text: string; path?: string }[] = wrap
      ? [{ text: `${indent}[`, path }]
      : [];
    value.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      const isPrimitive = item === null || ["string", "number", "boolean"].includes(typeof item);
      if (isPrimitive) {
        lines.push({
          text: `${" ".repeat(indentSize * (depth + 1))}${formatValue(item)}${
            index < value.length - 1 ? "," : ""
          }`,
          path: itemPath
        });
      } else {
        const child = renderSingle(item, itemPath, depth + 1, indentSize, true);
        const last = child.length - 1;
        child[last] = {
          text: `${child[last].text}${index < value.length - 1 ? "," : ""}`,
          path: child[last].path
        };
        lines.push(...child);
      }
    });
    if (wrap) lines.push({ text: `${indent}]`, path });
    return lines;
  }
  if (value && typeof value === "object") {
    const lines: { text: string; path?: string }[] = wrap
      ? [{ text: `${indent}{`, path }]
      : [];
    const keys = Object.keys(value as Record<string, unknown>);
    keys.forEach((k, idx) => {
      const childPath = path === "$" ? `$.${k}` : `${path}.${k}`;
      const v = (value as Record<string, unknown>)[k];
      const isPrimitive = v === null || ["string", "number", "boolean"].includes(typeof v);
      if (isPrimitive) {
        lines.push({
          text: `${" ".repeat(indentSize * (depth + 1))}"${k}": ${formatValue(v)}${
            idx < keys.length - 1 ? "," : ""
          }`,
          path: childPath
        });
      } else {
        const open = `${" ".repeat(indentSize * (depth + 1))}"${k}": ${
          Array.isArray(v) ? "[" : "{"
        }`;
        lines.push({ text: open, path: childPath });
        const child = renderSingle(v, childPath, depth + 2, indentSize, true);
        lines.push(...child);
        lines.push({
          text: `${" ".repeat(indentSize * (depth + 1))}${
            Array.isArray(v) ? "]" : "}"
          }${idx < keys.length - 1 ? "," : ""}`,
          path: childPath
        });
      }
    });
    if (wrap) lines.push({ text: `${indent}}`, path });
    return lines;
  }
  return [{ text: `${indent}${formatValue(value)}`, path }];
}

function renderAligned(
  aValue: unknown,
  bValue: unknown,
  path: string,
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
    const aLines = renderSingle(aValue, path, depth, aIndent, wrap);
    aLines.forEach((l) => {
      const indent = l.text.match(/^(\s*)/)?.[1] ?? "";
      lines.push({
        aText: l.text,
        bText: `${indent}`,
        aPath: l.path,
        bStatus: "missing"
      });
    });
    return;
  }
  if (!aExists && bExists) {
    const bLines = renderSingle(bValue, path, depth, bIndent, wrap);
    bLines.forEach((l) => {
      const indent = l.text.match(/^(\s*)/)?.[1] ?? "";
      lines.push({
        aText: `${indent}`,
        bText: l.text,
        bPath: l.path,
        aStatus: "missing",
        bStatus: "extra"
      });
    });
    return;
  }

  if (aIsArr && bIsArr) {
    const indentA = " ".repeat(aIndent * depth);
    const indentB = " ".repeat(bIndent * depth);
    if (wrap) {
      lines.push({
        aText: `${indentA}[`,
        bText: `${indentB}[`,
        aPath: path,
        bPath: path
      });
    }
    const maxLen = Math.max((aValue as unknown[]).length, (bValue as unknown[]).length);
    for (let i = 0; i < maxLen; i += 1) {
      const aItem = (aValue as unknown[])[i];
      const bItem = (bValue as unknown[])[i];
      const itemPath = `${path}[${i}]`;
      const before = lines.length;
      renderAligned(aItem, bItem, itemPath, depth + 1, lines, aIndent, bIndent, true);
      const lastIdx = lines.length - 1;
      if (lines.length > before) {
        if (aItem !== undefined && i < (aValue as unknown[]).length - 1) {
          lines[lastIdx].aText = `${lines[lastIdx].aText},`;
        }
        if (bItem !== undefined && i < (bValue as unknown[]).length - 1) {
          lines[lastIdx].bText = `${lines[lastIdx].bText},`;
        }
      }
    }
    if (wrap) {
      lines.push({
        aText: `${indentA}]`,
        bText: `${indentB}]`,
        aPath: path,
        bPath: path
      });
    }
    return;
  }

  if (aIsObj && bIsObj) {
    const indentA = " ".repeat(aIndent * depth);
    const indentB = " ".repeat(bIndent * depth);
    if (wrap) {
      lines.push({
        aText: `${indentA}{`,
        bText: `${indentB}{`,
        aPath: path,
        bPath: path
      });
    }
    const aObj = aValue as Record<string, unknown>;
    const bObj = bValue as Record<string, unknown>;
    const keys = [...Object.keys(aObj), ...Object.keys(bObj).filter((k) => !(k in aObj))];
    keys.forEach((k, idx) => {
      const childPath = path === "$" ? `$.${k}` : `${path}.${k}`;
      const aChild = aObj[k];
      const bChild = bObj[k];
      const aPrim = aChild === null || ["string", "number", "boolean"].includes(typeof aChild);
      const bPrim = bChild === null || ["string", "number", "boolean"].includes(typeof bChild);
      if (aPrim && bPrim) {
        lines.push({
          aText: `${" ".repeat(aIndent * (depth + 1))}"${k}": ${formatValue(aChild)}${
            idx < keys.length - 1 ? "," : ""
          }`,
          bText: `${" ".repeat(bIndent * (depth + 1))}"${k}": ${formatValue(bChild)}${
            idx < keys.length - 1 ? "," : ""
          }`,
          aPath: childPath,
          bPath: childPath
        });
      } else {
        const openA =
          aChild !== undefined
            ? `${" ".repeat(aIndent * (depth + 1))}"${k}": ${Array.isArray(aChild) ? "[" : "{"}`
            : "";
        const openB =
          bChild !== undefined
            ? `${" ".repeat(bIndent * (depth + 1))}"${k}": ${Array.isArray(bChild) ? "[" : "{"}`
            : "";
        if (openA || openB) {
          const aStatus = aChild === undefined ? "missing" : undefined;
          const bStatus = bChild === undefined ? "missing" : aChild === undefined ? "extra" : undefined;
          lines.push({
            aText: openA,
            bText: openB,
            aPath: childPath,
            bPath: childPath,
            aStatus,
            bStatus
          });
        }
        renderAligned(aChild, bChild, childPath, depth + 2, lines, aIndent, bIndent, false);
        const closeA =
          aChild !== undefined
            ? `${" ".repeat(aIndent * (depth + 1))}${Array.isArray(aChild) ? "]" : "}"}${
                idx < keys.length - 1 ? "," : ""
              }`
            : "";
        const closeB =
          bChild !== undefined
            ? `${" ".repeat(bIndent * (depth + 1))}${Array.isArray(bChild) ? "]" : "}"}${
                idx < keys.length - 1 ? "," : ""
              }`
            : "";
        if (closeA || closeB) {
          const aStatus = aChild === undefined ? "missing" : undefined;
          const bStatus = bChild === undefined ? "missing" : aChild === undefined ? "extra" : undefined;
          lines.push({
            aText: closeA,
            bText: closeB,
            aPath: childPath,
            bPath: childPath,
            aStatus,
            bStatus
          });
        }
      }
    });
    if (wrap) {
      lines.push({
        aText: `${indentA}}`,
        bText: `${indentB}}`,
        aPath: path,
        bPath: path
      });
    }
    return;
  }

  const indentA = " ".repeat(aIndent * depth);
  const indentB = " ".repeat(bIndent * depth);
  lines.push({
    aText: `${indentA}${formatValue(aValue)}`,
    bText: `${indentB}${formatValue(bValue)}`,
    aPath: path,
    bPath: path
  });
}

export function VisualComparePanel({ result }: { result: CompareResult }) {
  const { aMap, bMap } = useMemo(() => buildKindMaps(result.root), [result.root]);
  const aligned = useMemo(() => {
    const lines: LinePair[] = [];
    renderAligned(result.aRoot, result.bRoot, "$", 0, lines, result.aIndent, result.bIndent);
    return lines;
  }, [result.aRoot, result.bRoot, result.aIndent, result.bIndent]);

  return (
    <div className="flex flex-col gap-3">
      <DiffSummaryBar summary={result.summary} />
      <DiffLegend />
      <div className="json-scroll rounded-xl border border-[var(--border)]">
        <div className="grid grid-cols-2 gap-3 min-w-[720px]">
          <div className="overflow-hidden">
            <div className="sticky top-0 z-10 px-3 py-2 text-xs uppercase text-[var(--muted)] border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_75%,transparent)]">
              Reference JSON (A)
            </div>
            <div className="json-view">
              {aligned.map((line, idx) => {
                const inferred = line.aStatus
                  ? line.aStatus
                  : line.aPath
                    ? aMap.get(line.aPath)
                    : undefined;
                return (
                  <div key={`a-${idx}`} className={kindClass(inferred)}>
                    <span className="whitespace-pre">{line.aText}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="sticky top-0 z-10 px-3 py-2 text-xs uppercase text-[var(--muted)] border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_75%,transparent)]">
              Sorted Target (B)
            </div>
            <div className="json-view">
              {aligned.map((line, idx) => {
                const inferred = line.bStatus
                  ? line.bStatus
                  : line.bPath
                    ? bMap.get(line.bPath)
                    : undefined;
                return (
                  <div key={`b-${idx}`} className={kindClass(inferred)}>
                    <span className="whitespace-pre">{line.bText}</span>
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
