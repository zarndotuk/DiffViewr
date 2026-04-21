"use client";

type Props = {
  buttonClass: string;
  onLoadSample: () => void;
};

export function ToolIntro({ buttonClass, onLoadSample }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3">

      {/* ── Top row: description + CTA ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Description — plain prose, not a heading */}
        <p className="text-[14px] text-[var(--muted)] leading-relaxed max-w-2xl">
          Paste two files —{" "}
          <span className="text-[var(--text)] font-medium">your config text</span>
          {" "}— and instantly see what changed!
        </p>

        {/* Try an example — elevated, not hidden */}
        <button
  onClick={onLoadSample}
  type="button"
  aria-label="Load an example diff"
  title="Load an example diff"
  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-[12px] font-bold text-white rounded-full
             bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110
             shadow-[0_0_25px_-5px_rgba(99,102,241,0.5)] transition-all duration-300
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
             focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] cursor-pointer whitespace-nowrap"
>
  <svg
    width="14" height="14" viewBox="0 0 14 14"
    fill="none" aria-hidden="true"
    className="shrink-0"
  >
    <path
      d="M2 7h10M7 2l5 5-5 5"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
  Try an example
</button>

      </div>

      {/* ── Privacy note — inline, unobtrusive ── */}
   <p className="text-[11.5px] text-[var(--muted)] opacity-70 flex items-center gap-1.5">
  <svg
    width="14" height="14" viewBox="0 0 12 12"
    fill="none" aria-hidden="true"
    className="shrink-0 text-[var(--accent)]" 
  >
    <path
      d="M6 1L1.5 3v3.5C1.5 9.1 3.5 11 6 11s4.5-1.9 4.5-4.5V3L6 1z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M4.2 6l1.2 1.2 2.4-2.4"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
  Processed entirely in your browser — no server, no uploads, no data collected.
</p>

    </div>
  );
}
