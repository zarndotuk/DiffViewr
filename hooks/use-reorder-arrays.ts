"use client";

import { useCallback, useState } from "react";

export function useReorderArrays(): {
  reorderArrays: boolean;
  toggleReorderArrays: () => void;
} {
  const [reorderArrays, setReorderArrays] = useState(false);

  const toggleReorderArrays = useCallback(() => {
    setReorderArrays((v) => !v);
  }, []);

  return { reorderArrays, toggleReorderArrays };
}

