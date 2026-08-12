"use client";

import { cn } from "@/lib/utils";
import type { DiffRow } from "../types/audit-log.types";
import { fieldLabel, formatDiffValue } from "../utils/format";

interface AuditDiffProps {
  rows: DiffRow[];
  compact?: boolean;
  className?: string;
}

export function AuditDiff({ rows, compact = false, className }: AuditDiffProps) {
  if (rows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No field changes recorded.</p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {rows.map((row) => {
        const isObjectish =
          (typeof row.from === "object" && row.from != null) ||
          (typeof row.to === "object" && row.to != null);
        const fromText = formatDiffValue(row.field, row.from);
        const toText = formatDiffValue(row.field, row.to);

        return (
          <div
            key={row.field}
            className={cn(
              "rounded-lg border border-border/60 bg-muted/20",
              compact ? "px-2.5 py-2" : "px-3 py-2.5"
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {fieldLabel(row.field)}
            </p>
            {isObjectish && row.field !== "context_data" ? (
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                <pre className="max-h-40 overflow-auto rounded-md bg-background/80 p-2 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
                  {fromText}
                </pre>
                <pre className="max-h-40 overflow-auto rounded-md bg-background/80 p-2 text-[11px] leading-relaxed text-foreground whitespace-pre-wrap break-all">
                  {toText}
                </pre>
              </div>
            ) : (
              <p className="mt-1 text-xs leading-relaxed">
                <span className="text-muted-foreground line-through decoration-muted-foreground/60">
                  {fromText}
                </span>
                <span className="mx-1.5 text-muted-foreground">→</span>
                <span className="font-medium text-foreground">{toText}</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
