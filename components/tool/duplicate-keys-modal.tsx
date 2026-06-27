"use client";

import { useEffect, useRef } from "react";
import type { DuplicateKeyIssue } from "@/lib/duplicateKeys";

export type DuplicateIssueGroup = {
  side: "left" | "right";
  label: string;
  editorId: string;
  issues: DuplicateKeyIssue[];
};

type Props = {
  groups: DuplicateIssueGroup[];
  onEditFile: (group: DuplicateIssueGroup) => void;
};

export function DuplicateKeysModal({ groups, onEditFile }: Props) {
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const totalIssues = groups.reduce((sum, group) => sum + group.issues.length, 0);

  useEffect(() => {
    firstActionRef.current?.focus();
  }, []);

  if (groups.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6"
      role="presentation"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        onEditFile(groups[0]);
      }}
    >
      <section
        className="w-full max-w-3xl overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--danger)_55%,var(--border))] bg-[var(--panel)] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-keys-title"
        aria-describedby="duplicate-keys-description"
      >
        <div className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--danger)_12%,var(--panel))] px-4 py-4 sm:px-5">
          <p className="font-mono text-[11px] uppercase tracking-[1.6px] text-[var(--danger)]">
            Duplicate key validation
          </p>
          <h2 id="duplicate-keys-title" className="mt-2 text-xl font-semibold tracking-tight text-[var(--text)]">
            Duplicate keys found, fix before comparing
          </h2>
          <p id="duplicate-keys-description" className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            DiffViewr blocks last-write-wins behavior. Remove duplicates or merge values into one definition, then compare again.
          </p>
        </div>

        <div className="max-h-[68dvh] overflow-y-auto px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-3 font-mono text-xs text-[var(--muted)]">
            <span>{totalIssues} issue{totalIssues === 1 ? "" : "s"} found</span>
            <span>No compare bypass available</span>
          </div>

          <div className="space-y-4">
            {groups.map((group, groupIndex) => (
              <div
                key={group.side}
                className="rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel2)_68%,transparent)]"
              >
                <div className="flex flex-col gap-3 border-b border-[var(--border)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)]">{group.label}</h3>
                    <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                      {group.issues.length} duplicate key issue{group.issues.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    ref={groupIndex === 0 ? firstActionRef : undefined}
                    type="button"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#0c0e11] transition-transform active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
                    onClick={() => onEditFile(group)}
                  >
                    Edit file
                  </button>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {group.issues.map((issue, index) => {
                    const showPath = issue.fileType !== "env" && Boolean(issue.path);
                    const pathLabel = issue.path === "$" ? "Root object" : issue.path;
                    return (
                      <div
                        key={`${issue.key}-${issue.path ?? "global"}-${index}`}
                        className="grid gap-2 px-3 py-3 text-sm sm:grid-cols-[minmax(8rem,1fr)_minmax(10rem,1.5fr)_auto_auto]"
                      >
                        <div>
                          <div className="font-mono text-xs text-[var(--muted)]">Key</div>
                          <div className="mt-1 break-all font-mono text-[var(--text)]">{issue.key}</div>
                        </div>
                        {showPath ? (
                          <div>
                            <div className="font-mono text-xs text-[var(--muted)]">Path</div>
                            <div className="mt-1 break-all font-mono text-[var(--text)]">{pathLabel}</div>
                          </div>
                        ) : (
                          <div className="hidden sm:block" aria-hidden="true" />
                        )}
                        <div className="sm:text-right">
                          <div className="font-mono text-xs text-[var(--muted)]">Line</div>
                          <div className="mt-1 font-mono text-[var(--text)]">
                            {typeof issue.line === "number" ? issue.line : "Unknown"}
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <div className="font-mono text-xs text-[var(--muted)]">Occurrences</div>
                          <div className="mt-1 font-mono text-[var(--text)]">{issue.occurrences}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
