"use client";

import { Activity, Clock, MessageSquare, AlertCircle, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetStatus } from "../types/analytics.types";
import { toPercent, formatMs } from "../utils/format";
import { ANALYTICS_COLORS } from "../constants";
import { EmptyState } from "./EmptyState";

interface WidgetStatusCardProps {
  data: WidgetStatus | null | undefined;
  loading?: boolean;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "No activity yet";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function WidgetStatusCard({ data, loading }: WidgetStatusCardProps) {
  if (loading) {
    return <Skeleton className="h-52 w-full rounded-xl" />;
  }

  if (!data) {
    return (
      <EmptyState
        icon={Bot}
        message="No recent widget activity to report."
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.widget && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{data.widget.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
              {data.widget.widget_id}
            </p>
          </div>
          <Badge
            variant={data.widget.is_active ? "default" : "secondary"}
            className="shrink-0"
          >
            {data.widget.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-border/50 bg-background/60 p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
            <Activity className="h-3.5 w-3.5" style={{ color: ANALYTICS_COLORS.primary }} />
            Last 24h
          </div>
          <p className="text-xl font-bold tabular-nums tracking-tight">
            {data.conversations_last_24h.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {data.messages_last_24h.toLocaleString()} messages
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/60 p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" style={{ color: ANALYTICS_COLORS.sky }} />
            Avg response
          </div>
          <p className="text-xl font-bold tabular-nums tracking-tight">
            {formatMs(data.avg_response_time_ms_last_24h)}
          </p>
          <p className="text-xs text-muted-foreground">
            Last active {formatRelativeTime(data.last_conversation_at)}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-2 text-xs">
          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>
            Classification backlog:{" "}
            <strong className="tabular-nums">{data.classification_backlog}</strong> uncategorized
            (24h)
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-2 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            Uncategorized share (7d):{" "}
            <strong className="tabular-nums">
              {toPercent(data.uncategorized_share_last_7d, 1)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
