"use client";

import { Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopPage } from "../types/analytics.types";
import { truncateUrl } from "../utils/format";
import { ANALYTICS_COLORS } from "../constants";
import { EmptyState } from "./EmptyState";

interface TopPagesTableProps {
  data: TopPage[];
  loading?: boolean;
}

export function TopPagesTable({ data, loading }: TopPagesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Globe}
        message="No widget page URLs recorded in this range."
      />
    );
  }

  const max = Math.max(...data.map((d) => d.conversations_count), 1);

  return (
    <div className="space-y-1.5">
      {data.map((page, index) => {
        const pct = (page.conversations_count / max) * 100;
        return (
          <div
            key={page.page_url}
            className="group relative overflow-hidden rounded-lg border border-border/40 bg-muted/10 px-2.5 py-2 transition-colors hover:border-border/70 hover:bg-muted/20"
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 opacity-[0.06] transition-opacity group-hover:opacity-[0.1]"
              style={{
                width: `${pct}%`,
                background: ANALYTICS_COLORS.primary,
              }}
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary tabular-nums">
                  {index + 1}
                </span>
                <span
                  title={page.page_url}
                  className="truncate font-mono text-[11px] text-foreground/90"
                >
                  {truncateUrl(page.page_url, 48)}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {page.conversations_count.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
