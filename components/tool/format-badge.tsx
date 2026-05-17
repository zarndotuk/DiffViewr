"use client";

import { useEffect, useRef, useState } from "react";

export type FormatBadgeFormat = "json" | "yaml" | "env" | "unknown";

const formatToLabel: Record<FormatBadgeFormat, string> = {
  json: "JSON",
  yaml: "YAML",
  env: "ENV",
  unknown: "?",
};

const formatToAccentClass: Record<FormatBadgeFormat, string> = {
  json: "[--accent:theme(colors.emerald.500)]",
  yaml: "[--accent:theme(colors.blue.500)]",
  env: "[--accent:theme(colors.amber.500)]",
  unknown: "[--accent:theme(colors.zinc.500)]",
};

export function FormatBadge({ format }: { format: FormatBadgeFormat }) {
  const [shownFormat, setShownFormat] = useState<FormatBadgeFormat>(format);
  const [isVisible, setIsVisible] = useState(true);
  const shownFormatRef = useRef(shownFormat);

  useEffect(() => {
    shownFormatRef.current = shownFormat;
  }, [shownFormat]);

  useEffect(() => {
    if (format === shownFormatRef.current) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

    if (reduceMotion) {
      setShownFormat(format);
      setIsVisible(true);
      return;
    }

    setIsVisible(false);
    const t = setTimeout(() => {
      setShownFormat(format);
      requestAnimationFrame(() => setIsVisible(true));
    }, 120);

    return () => clearTimeout(t);
  }, [format]);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5",
        "text-[12px] font-semibold tracking-wide",
        "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]",
        "border-[color-mix(in_srgb,var(--accent)_32%,transparent)]",
        "text-[color-mix(in_srgb,var(--accent)_72%,var(--text))]",
        "transition-opacity duration-150 ease-out motion-reduce:transition-none",
        isVisible ? "opacity-100" : "opacity-0",
        formatToAccentClass[shownFormat],
      ].join(" ")}
      aria-label={`Detected format: ${formatToLabel[shownFormat]}`}
      title={formatToLabel[shownFormat]}
    >
      {formatToLabel[shownFormat]}
    </span>
  );
}
