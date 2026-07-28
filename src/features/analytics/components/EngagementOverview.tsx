"use client";

import { MessagesSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsSummary } from "../types/analytics.types";
import { ANALYTICS_COLORS } from "../constants";

interface EngagementOverviewProps {
  summary: AnalyticsSummary | undefined;
  loading?: boolean;
}

export function EngagementOverview({ summary, loading }: EngagementOverviewProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
    );
  }

  const replied = summary?.conversations_replied ?? 0;
  const abandoned = summary?.conversations_abandoned ?? 0;
  const totalOutcomes = replied + abandoned;
  const replyRate = totalOutcomes > 0 ? (replied / totalOutcomes) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/50 bg-background/60 p-3">
        <div className="mb-2 flex flex-col gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Reply rate
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight">
              {totalOutcomes > 0 ? `${replyRate.toFixed(0)}%` : "—"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {replied.toLocaleString()}
            </span>{" "}
            replied
            <span className="mx-1.5 text-border">·</span>
            <span className="font-semibold text-foreground tabular-nums">
              {abandoned.toLocaleString()}
            </span>{" "}
            abandoned
          </p>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-l-full transition-all duration-500"
            style={{
              width: `${replyRate}%`,
              background: `linear-gradient(90deg, ${ANALYTICS_COLORS.primary}, ${ANALYTICS_COLORS.violet})`,
            }}
          />
          <div
            className="h-full flex-1 rounded-r-full bg-muted-foreground/20"
            style={{ width: `${100 - replyRate}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/60 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessagesSquare
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: ANALYTICS_COLORS.violet }}
          />
          Avg messages / conversation
        </div>
        <p className="text-lg font-bold tabular-nums tracking-tight">
          {summary ? summary.avg_messages_per_conversation.toFixed(1) : "—"}
        </p>
      </div>
    </div>
  );
}
