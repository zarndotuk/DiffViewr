import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DiffViewr — Config File Diff Tool",
  description:
    "Paste your template config as A and your environment config as B. DiffViewr shows only what actually changed, ignoring key-order noise."
};

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
