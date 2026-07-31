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
  contentScrollHeight: number;
  contentTopOffset: number;
  viewportContentTop: number;
  viewportContentHeight: number;
  rowHeight: number;
};

export function MiniMap({
  visibleLineIndices,
  changeLineIndices,
  aligned,
  inferBetweenKind,
  activeFilterSet,
  onScrollToLine,
  contentScrollHeight,
  contentTopOffset,
  viewportContentTop,
  viewportContentHeight,
  rowHeight
}: MiniMapProps) {
  const clampPercent = (value: number) => Math.min(100, Math.max(0, value));
  const safeContentHeight = Math.max(1, contentScrollHeight);

  const segments = useMemo(() => {
    const result: Array<{ kind: DiffKind | "same" | "hidden"; position: number }> = [];
    const visiblePositions = new Map(
      visibleLineIndices.map((lineIndex, visiblePosition) => [lineIndex, visiblePosition])
    );

    for (const lineIndex of changeLineIndices) {
      const visiblePosition = visiblePositions.get(lineIndex);
      if (visiblePosition === undefined) continue;

      const kind = inferBetweenKind(aligned[lineIndex]);
      if (kind && kind !== "same" && activeFilterSet.has(kind as DiffKind)) {
        result.push({
          kind,
          position: clampPercent((visiblePosition * rowHeight / safeContentHeight) * 100)
        });
      }
    }
    return result;
  }, [
    activeFilterSet,
    aligned,
    changeLineIndices,
    inferBetweenKind,
    rowHeight,
    safeContentHeight,
    visibleLineIndices
  ]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const scrollRatio = rect.height > 0 ? clickY / rect.height : 0;
    const targetContentOffset = scrollRatio * safeContentHeight;
    const targetVisiblePosition = Math.min(
      visibleLineIndices.length - 1,
      Math.max(0, Math.floor(targetContentOffset / rowHeight))
    );
    const targetLineIndex = visibleLineIndices[targetVisiblePosition];
    if (targetLineIndex !== undefined) onScrollToLine(targetLineIndex);
  };

  const viewportIndicatorTop = clampPercent((viewportContentTop / safeContentHeight) * 100);
  const viewportIndicatorHeight = Math.min(
    100 - viewportIndicatorTop,
    clampPercent((viewportContentHeight / safeContentHeight) * 100)
  );
  const markerHeight = clampPercent((rowHeight / safeContentHeight) * 100);

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
      className="sticky top-[40px] flex-shrink-0 w-[20px] border-l border-r border-[var(--border)] cursor-pointer overflow-hidden"
      style={{ height: safeContentHeight, marginTop: contentTopOffset }}
      onClick={handleClick}
      role="button"
      aria-label="Mini-map: click to scroll to position"
      tabIndex={0}
    >
      {segments.map((segment, index) => (
        <div
          key={index}
          className={`absolute left-0 right-0 ${getSegmentColor(segment.kind)}`}
          style={{ top: `${segment.position}%`, height: `${markerHeight}%` }}
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
