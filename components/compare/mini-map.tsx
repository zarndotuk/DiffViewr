"use client";

import { useMemo } from "react";
import type { DiffKind } from "@/types/diff";

type LinePair = {
  aText: string;
  bText: string;
  aPath?: string;
  bPath?: string;
  aStatus?: DiffKind;
  bStatus?: DiffKind;
};

type MiniMapProps = {
  visibleLineIndices: number[];
  changeLineIndices: number[];
  aligned: LinePair[];
  inferBetweenKind: (line: LinePair) => DiffKind | undefined;
  activeFilterSet: Set<DiffKind>;
  onScrollToLine: (lineIndex: number) => void;
  scrollTop: number;
  viewportHeight: number;
  totalHeight: number;
  rowHeight: number;
};

export function MiniMap({
  visibleLineIndices,
  changeLineIndices,
  aligned,
  inferBetweenKind,
  activeFilterSet,
  onScrollToLine,
  scrollTop,
  viewportHeight,
  totalHeight,
  rowHeight
}: MiniMapProps) {
  const segments = useMemo(() => {
    const result: Array<{ kind: DiffKind | "same" | "hidden"; position: number }> = [];
    for (let i = 0; i < aligned.length; i += 1) {
      const kind = inferBetweenKind(aligned[i]);
      const isVisible = !kind || kind === "same" || activeFilterSet.has(kind as DiffKind);
      if (isVisible) {
        const position = (i * rowHeight / totalHeight) * 100;
        if (kind && kind !== "same") {
          result.push({ kind, position });
        }
      }
    }
    return result;
  }, [aligned, inferBetweenKind, activeFilterSet, rowHeight, totalHeight]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const scrollRatio = clickY / rect.height;
    const targetScrollTop = scrollRatio * totalHeight;
    const targetLineIndex = Math.floor(targetScrollTop / rowHeight);
    onScrollToLine(targetLineIndex);
  };

  const viewportIndicatorTop = (scrollTop / totalHeight) * 100;
  const viewportIndicatorHeight = (viewportHeight / totalHeight) * 100;

  const getSegmentColor = (kind: DiffKind | "same" | "hidden") => {
    switch (kind) {
      case "missing":
        return "bg-red-400";
      case "extra":
        return "bg-emerald-400";
      case "changed":
        return "bg-amber-400";
      case "type_mismatch":
        return "bg-purple-400";
      case "same":
        return "bg-transparent";
      case "hidden":
        return "bg-transparent";
      default:
        return "bg-transparent";
    }
  };

  return (
    <div
      className="relative flex-shrink-0 w-[20px] border-l border-r border-[var(--border)] cursor-pointer overflow-hidden"
      style={{ height: totalHeight }}
      onClick={handleClick}
      role="button"
      aria-label="Mini-map: click to scroll to position"
      tabIndex={0}
    >
      {segments.map((segment, index) => (
        <div
          key={index}
          className={`absolute left-0 right-0 ${getSegmentColor(segment.kind)}`}
          style={{ top: `${segment.position}%`, height: `${(rowHeight / totalHeight) * 100}%` }}
        />
      ))}
      <div
        className="absolute left-0 right-0 bg-white/20 pointer-events-none"
        style={{
          top: `${viewportIndicatorTop}%`,
          height: `${viewportIndicatorHeight}%`
        }}
      />
    </div>
  );
}
