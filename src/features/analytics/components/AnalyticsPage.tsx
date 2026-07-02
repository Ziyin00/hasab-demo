"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "./StatCard";
import { TrendChart } from "./TrendChart";
import { ConversationInbox } from "./ConversationInbox";
import { useAnalytics } from "../hooks/useAnalytics";
import type { AnalyticsRange } from "../types/analytics.types";

const RANGES: { label: string; value: AnalyticsRange }[] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

function fmtPercent(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}% this week`;
}

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const { data, isLoading } = useAnalytics(range);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Conversation volume and engagement over the selected period.
          </p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Messages"
          value={summary ? summary.total_messages.toLocaleString() : "—"}
          sub={summary ? fmtPercent(summary.changes.messages_percent) : undefined}
          subPositive={(summary?.changes.messages_percent ?? 0) >= 0}
          loading={isLoading}
        />
        <StatCard
          label="Conversations"
          value={summary ? summary.total_conversations.toLocaleString() : "—"}
          sub={summary ? fmtPercent(summary.changes.conversations_percent) : undefined}
          subPositive={(summary?.changes.conversations_percent ?? 0) >= 0}
          loading={isLoading}
        />
        <StatCard
          label="Avg. Response"
          value={summary?.avg_response_time_display ?? "—"}
          sub="Stable"
          loading={isLoading}
        />
        <StatCard
          label="Satisfaction"
          value={summary?.satisfaction_rate != null ? `${summary.satisfaction_rate.toFixed(0)}%` : "—"}
          sub={
            summary?.satisfaction_rate != null && summary.satisfaction_sample_size > 0
              ? `Based on ${summary.satisfaction_sample_size} ratings`
              : undefined
          }
          subPositive
          loading={isLoading}
        />
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">Conversation Trends</h2>
        <div className="h-64">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-lg bg-muted" />
          ) : (
            <TrendChart data={data?.trend ?? []} />
          )}
        </div>
      </div>

      <ConversationInbox range={range} />
    </div>
  );
}
