"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { detectFormat } from "@/lib/detectFormat";

type DetectedFormat = ReturnType<typeof detectFormat>;

type Options = {
  debounceMs?: number;
};

export function useFormatDetection(
  value: string,
  options?: Options,
): {
  format: DetectedFormat;
  isDetecting: boolean;
  detectNow: (nextValue?: string) => void;
  markNextChangeImmediate: () => void;
} {
  const [format, setFormat] = useState<DetectedFormat>(() => detectFormat(value));
  const [isDetecting, setIsDetecting] = useState(false);
  const immediateNextChange = useRef(false);
  const lastValue = useRef(value);
  const debounceMs = options?.debounceMs ?? 600;

  const detectNow = useCallback(
    (nextValue?: string) => {
      setIsDetecting(true);
      setFormat(detectFormat(nextValue ?? value));
      setIsDetecting(false);
    },
    [value],
  );

  const markNextChangeImmediate = useCallback(() => {
    immediateNextChange.current = true;
  }, []);

  useEffect(() => {
    if (value === lastValue.current) {
      return;
    }
    lastValue.current = value;

    if (immediateNextChange.current) {
      immediateNextChange.current = false;
      detectNow();
      return;
    }

    setFormat("unknown");

    // Only perform detection after the user has stopped typing for the debounce period.
    // Do not flip isDetecting on every keystroke so the input keeps stable focus.
    const t = setTimeout(() => {
      setFormat(detectFormat(value));
    }, debounceMs);

    return () => clearTimeout(t);
  }, [debounceMs, detectNow, value]);

  return { format, isDetecting, detectNow, markNextChangeImmediate };
}
