"use client";

import { Gauge, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResponseTimeStats } from "../types/analytics.types";
import { ANALYTICS_COLORS } from "../constants";
import { formatMs } from "../utils/format";
import { EmptyState } from "./EmptyState";

interface ResponseTimePanelProps {
  data: ResponseTimeStats | undefined;
  loading?: boolean;
}

export function ResponseTimePanel({ data, loading }: ResponseTimePanelProps) {
  if (loading) {
    return <Skeleton className="h-28 w-full rounded-xl" />;
  }

  if (!data?.display) {
    return (
      <EmptyState
        icon={Timer}
        message="No assistant response times recorded in this range."
      />
    );
  }

  const p95 = data.p95_ms ?? 0;
  const p50 = data.p50_ms ?? 0;
  const maxRef = Math.max(p95, p50, 1);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Median (p50)
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums">{formatMs(data.p50_ms)}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-sky-500/70"
              style={{ width: `${(p50 / maxRef) * 100}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            p95
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums">{formatMs(data.p95_ms)}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(p95 / maxRef) * 100}%`,
                background: `linear-gradient(90deg, ${ANALYTICS_COLORS.sky}, ${ANALYTICS_COLORS.indigo})`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
        <Gauge className="h-3.5 w-3.5 shrink-0" />
        Lower p95 means more consistent response times for visitors.
      </div>
    </div>
  );
}
