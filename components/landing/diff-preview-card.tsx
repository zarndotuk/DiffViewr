"use client";

import React from "react";

type PreviewLine = {
  ln: number | "";
  kind: "neutral" | "changed" | "extra" | "missing" | "empty";
  depth: number;
  content: React.ReactNode;
};

function indent(depth: number, size = 2) {
  return " ".repeat(depth * size);
}

function lineTintClass(kind: PreviewLine["kind"]) {
  switch (kind) {
    case "changed":
      return "bg-[color-mix(in_srgb,var(--warn)_10%,transparent)]";
    case "extra":
      return "bg-[color-mix(in_srgb,var(--ok)_10%,transparent)]";
    case "missing":
      return "bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]";
    default:
      return "";
  }
}

const bLines: PreviewLine[] = [
  { ln: 1, kind: "neutral", depth: 0, content: <span className="text-[var(--muted)]">{"{"}</span> },
  {
    ln: 2,
    kind: "neutral",
    depth: 1,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;Serilog&quot;</span>
        <span className="text-[var(--muted)]">{": {"}</span>
      </>
    )
  },
  {
    ln: 3,
    kind: "neutral",
    depth: 2,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;MinimumLevel&quot;</span>
        <span className="text-[var(--muted)]">{": {"}</span>
      </>
    )
  },
  {
    ln: 4,
    kind: "changed",
    depth: 3,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;Default&quot;</span>
        <span className="text-amber-200/60">: </span>
        <span className="text-amber-300">&quot;Warning&quot;</span>
        <span className="text-amber-200/60">,</span>
      </>
    )
  },
  {
    ln: 5,
    kind: "extra",
    depth: 3,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;System&quot;</span>
        <span className="text-emerald-200/60">: </span>
        <span className="text-emerald-300">&quot;Information&quot;</span>
        <span className="text-emerald-200/60">,</span>
      </>
    )
  },
  {
    ln: 6,
    kind: "neutral",
    depth: 2,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;Override&quot;</span>
        <span className="text-[var(--muted)]">{": {"}</span>
      </>
    )
  },
  {
    ln: 7,
    kind: "changed",
    depth: 3,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;Microsoft&quot;</span>
        <span className="text-amber-200/60">: </span>
        <span className="text-amber-300">&quot;Warning&quot;</span>
      </>
    )
  },
  { ln: 8, kind: "neutral", depth: 2, content: <span className="text-[var(--muted)]">{"}"}</span> },
  { ln: 9, kind: "neutral", depth: 1, content: <span className="text-[var(--muted)]">{"}"}</span> },
  { ln: 10, kind: "neutral", depth: 0, content: <span className="text-[var(--muted)]">{"}"}</span> }
];

const aLines: PreviewLine[] = [
  { ln: 1, kind: "neutral", depth: 0, content: <span className="text-[var(--muted)]">{"{"}</span> },
  {
    ln: 2,
    kind: "neutral",
    depth: 1,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;Serilog&quot;</span>
        <span className="text-[var(--muted)]">{": {"}</span>
      </>
    )
  },
  {
    ln: 3,
    kind: "neutral",
    depth: 2,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;MinimumLevel&quot;</span>
        <span className="text-[var(--muted)]">{": {"}</span>
      </>
    )
  },
  {
    ln: 4,
    kind: "changed",
    depth: 3,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;Default&quot;</span>
        <span className="text-amber-200/60">: </span>
        <span className="text-amber-300">&quot;Information&quot;</span>
        <span className="text-amber-200/60">,</span>
      </>
    )
  },
  {
    ln: 5,
    kind: "missing",
    depth: 3,
    content: <span className="text-[color-mix(in_srgb,var(--danger)_70%,var(--text))] opacity-60">-</span>
  },
  {
    ln: 6,
    kind: "neutral",
    depth: 2,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;Override&quot;</span>
        <span className="text-[var(--muted)]">{": {"}</span>
      </>
    )
  },
  {
    ln: 7,
    kind: "changed",
    depth: 3,
    content: (
      <>
        <span className="text-[#6b8cba]">&quot;Microsoft&quot;</span>
        <span className="text-amber-200/60">: </span>
        <span className="text-amber-300">&quot;Information&quot;</span>
      </>
    )
  },
  { ln: 8, kind: "neutral", depth: 2, content: <span className="text-[var(--muted)]">{"}"}</span> },
  { ln: 9, kind: "neutral", depth: 1, content: <span className="text-[var(--muted)]">{"}"}</span> },
  { ln: 10, kind: "neutral", depth: 0, content: <span className="text-[var(--muted)]">{"}"}</span> }
];

const paired = aLines.map((a, idx) => ({ a, b: bLines[idx] }));

export function DiffPreviewCard() {
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
      role="img"
      aria-label="DiffViewr showing a minimal side-by-side JSON comparison preview"
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-[color-mix(in_srgb,var(--panel)_75%,transparent)] border-b border-[var(--border)]">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[var(--muted)]">diffviewr visual compare</span>
        <span className="font-mono text-[10px] text-[color-mix(in_srgb,var(--muted)_75%,transparent)]">local</span>
      </div>

      <div className="flex divide-x divide-[var(--border)]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[var(--bg)] border-b border-[var(--border)]">
            <span className="font-mono text-[10px] font-semibold text-[var(--text)] uppercase tracking-wide">Template (A)</span>
            <span className="font-mono text-[10px] text-[var(--muted)] truncate">appsettings.tpl.json</span>
          </div>
          <div className="py-1 font-mono text-[11px] leading-[1.8]">
            {paired.map(({ a }, idx) => (
              <div key={idx} className={`flex min-h-[22px] items-center gap-2 px-3 ${lineTintClass(a.kind)}`}>
                <span className="w-4 text-right text-[9px] text-[var(--muted)] opacity-50 shrink-0 select-none">
                  {a.ln}
                </span>
                <span className="flex-1 whitespace-pre overflow-hidden text-ellipsis">
                  {indent(a.depth)}
                  {a.content}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[var(--bg)] border-b border-[var(--border)]">
            <span className="font-mono text-[10px] font-semibold text-[var(--text)] uppercase tracking-wide">Aligned (B)</span>
            <span className="font-mono text-[10px] text-[var(--muted)] truncate">appsettings.stg.json</span>
          </div>
          <div className="py-1 font-mono text-[11px] leading-[1.8]">
            {paired.map(({ b }, idx) => (
              <div key={idx} className={`flex min-h-[22px] items-center gap-2 px-3 ${lineTintClass(b.kind)}`}>
                <span className="w-4 text-right text-[9px] text-[var(--muted)] opacity-50 shrink-0 select-none">
                  {b.ln}
                </span>
                <span className="flex-1 whitespace-pre overflow-hidden text-ellipsis">
                  {indent(b.depth)}
                  {b.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
