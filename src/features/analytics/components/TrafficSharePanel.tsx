"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { ShareBreakdownItem } from "../utils/format";
import { toPercent } from "../utils/format";
import { CHART_PALETTE } from "../constants";
import { EmptyState } from "./EmptyState";
import { BarChart2 } from "lucide-react";

interface TrafficSharePanelProps {
  data: ShareBreakdownItem[];
  loading?: boolean;
  emptyMessage?: string;
  summary?: string;
}

export function TrafficSharePanel({
  data,
  loading,
  emptyMessage = "No data for this period.",
  summary,
}: TrafficSharePanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState icon={BarChart2} message={emptyMessage} />;
  }

  const top = data[0];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {summary ?? (
          <>
            <span className="font-semibold text-foreground">{top.label}</span>
            {" leads at "}
            <span className="font-semibold tabular-nums text-foreground">
              {toPercent(top.share, 0)}
            </span>
          </>
        )}
      </p>

      <div className="space-y-3">
        {data.map((row, i) => (
          <div key={row.key} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium">{row.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.conversations_count.toLocaleString()} · {toPercent(row.share, 0)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(row.share * 100, 2)}%`,
                  background: CHART_PALETTE[i % CHART_PALETTE.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
