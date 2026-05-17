"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  rating: number;
  onRate: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  buttonBase: string;
  buttonPrimary: string;
};

export function RatingModal({
  open,
  rating,
  onRate,
  onClose,
  onConfirm,
  confirmDisabled,
  buttonBase,
  buttonPrimary
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;

    lastFocusRef.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lastFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 modal-overlay-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        aria-describedby="feedback-desc"
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] p-5 shadow-[var(--shadow)] modal-card-in focus:outline-none"
      >
        <div className="text-sm text-[var(--muted)] mb-1">Quick favor</div>
        <h3 id="feedback-title" className="text-lg font-semibold">
          How was the experience?
        </h3>
        <p id="feedback-desc" className="text-[14px] text-[var(--muted)] mt-2 leading-relaxed">
          A quick star rating helps us improve.
        </p>
        <div className="mt-4 flex items-center gap-2" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`text-2xl transition-transform ${
                rating >= star ? "text-[var(--accent)]" : "text-[var(--muted)]"
              } hover:scale-110`}
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              onClick={() => onRate(star)}
            >
              ★
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button className={buttonBase} type="button" onClick={onClose}>
            Not now
          </button>
          <button
            className={buttonPrimary}
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

