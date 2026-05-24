"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dv-reorder-arrays";

export function useReorderArrays(): {
  reorderArrays: boolean;
  toggleReorderArrays: () => void;
} {
  const [reorderArrays, setReorderArrays] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) return;
      setReorderArrays(raw === "true");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(reorderArrays));
    } catch {
      // ignore
    }
  }, [reorderArrays]);

  const toggleReorderArrays = useCallback(() => {
    setReorderArrays((v) => !v);
  }, []);

  return { reorderArrays, toggleReorderArrays };
}

