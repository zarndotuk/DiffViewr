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
  const isFirstRun = useRef(true);
  const immediateNextChange = useRef(false);
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
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (immediateNextChange.current) {
      immediateNextChange.current = false;
      detectNow();
      return;
    }

    setIsDetecting(true);
    const t = setTimeout(() => {
      setFormat(detectFormat(value));
      setIsDetecting(false);
    }, debounceMs);

    return () => clearTimeout(t);
  }, [debounceMs, detectNow, value]);

  return { format, isDetecting, detectNow, markNextChangeImmediate };
}
