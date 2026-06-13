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
      className="overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[var(--panel)] shadow-[0_28px_80px_rgba(0,8,13,0.48)]"
      role="img"
      aria-label="DiffViewr showing a minimal side-by-side JSON comparison preview"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_84%,var(--bg))] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[var(--text)]">DiffViewr / visual compare</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          local
        </span>
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

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_72%,var(--panel))] px-4 py-2.5 font-mono text-[10px] sm:justify-start">
        <span className="text-[var(--muted)]">
          <strong className="mr-1 text-amber-300">2</strong>
          changed
        </span>
        <span className="text-[var(--muted)]">
          <strong className="mr-1 text-emerald-300">1</strong>
          added
        </span>
        <span className="text-[var(--muted)]">
          <strong className="mr-1 text-cyan-300">7</strong>
          aligned
        </span>
      </div>
    </div>
  );
}
