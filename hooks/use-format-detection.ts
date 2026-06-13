"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConfigWorker } from "@/hooks/use-config-worker";
import type { SupportedFormat } from "@/lib/validateInput";

type DetectedFormat = SupportedFormat;

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
  const { validate } = useConfigWorker();
  const [format, setFormat] = useState<DetectedFormat>("unknown");
  const [isDetecting, setIsDetecting] = useState(false);
  const immediateNextChange = useRef(false);
  const lastValue = useRef(value);
  const requestVersion = useRef(0);
  const debounceMs = options?.debounceMs ?? 600;

  const detectNow = useCallback(
    (nextValue?: string) => {
      const input = nextValue ?? value;
      const requestId = ++requestVersion.current;
      setIsDetecting(true);
      void validate(input)
        .then((response) => {
          if (requestId === requestVersion.current) setFormat(response.format);
        })
        .catch(() => {
          if (requestId === requestVersion.current) setFormat("unknown");
        })
        .finally(() => {
          if (requestId === requestVersion.current) setIsDetecting(false);
        });
    },
    [validate, value],
  );

  const markNextChangeImmediate = useCallback(() => {
    immediateNextChange.current = true;
  }, []);

  useEffect(() => {
    requestVersion.current += 1;
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
    const t = setTimeout(() => detectNow(value), debounceMs);

    return () => clearTimeout(t);
  }, [debounceMs, detectNow, value]);

  return { format, isDetecting, detectNow, markNextChangeImmediate };
}
