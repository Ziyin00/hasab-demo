"use client";

import { useState } from "react";
import { MessageSquare, Users, Clock, ThumbsUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "./StatCard";
import { TrendChart } from "./TrendChart";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { useAnalytics } from "../hooks/useAnalytics";
import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import { cn } from "@/lib/utils";
import type { AnalyticsRange } from "../types/analytics.types";

const RANGES: { label: string; value: AnalyticsRange }[] = [
  { label: "7D", value: "7d" },
  { label: "14D", value: "14d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
];

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [widgetId, setWidgetId] = useState("all");
  const { data: widgets } = useChatbotWidgets();
  const { data, isLoading } = useAnalytics(range, widgetId !== "all" ? Number(widgetId) : undefined);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Conversation volume and engagement metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={widgetId} onValueChange={setWidgetId}>
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All widgets</SelectItem>
              {(widgets ?? []).map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Range toggle pills */}
          <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                  range === r.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Messages"
          icon={<MessageSquare className="h-4 w-4" />}
          iconColor="#A855F7"
          value={summary ? summary.total_messages.toLocaleString() : "—"}
          trend={summary?.changes.messages_percent}
          loading={isLoading}
        />
        <StatCard
          label="Conversations"
          icon={<Users className="h-4 w-4" />}
          iconColor="#6366F1"
          value={summary ? summary.total_conversations.toLocaleString() : "—"}
          trend={summary?.changes.conversations_percent}
          loading={isLoading}
        />
        <StatCard
          label="Avg. Response"
          icon={<Clock className="h-4 w-4" />}
          iconColor="#0EA5E9"
          value={summary?.avg_response_time_display ?? "—"}
          sub="Stable this week"
          subNeutral
          loading={isLoading}
        />
        <StatCard
          label="Satisfaction"
          icon={<ThumbsUp className="h-4 w-4" />}
          iconColor="#22C55E"
          value={
            summary?.satisfaction_rate != null
              ? `${Math.round(summary.satisfaction_rate * 100)}%`
              : "—"
          }
          sub={
            summary?.satisfaction_rate != null && summary.satisfaction_sample_size > 0
              ? `${summary.satisfaction_sample_size} ratings`
              : "No ratings yet"
          }
          subPositive={summary?.satisfaction_rate != null}
          loading={isLoading}
        />
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold">Conversation Trends</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Messages and conversations over time
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full bg-[#A855F7] inline-block" />
              Messages
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full bg-[#6366F1] inline-block" />
              Conversations
            </span>
          </div>
        </div>
        <div className="h-72">
          {isLoading ? (
            <div className="h-full rounded-xl bg-muted/50 animate-pulse" />
          ) : (
            <TrendChart data={data?.trend ?? []} />
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-5">
          <h2 className="text-sm font-semibold">By Category</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share of conversations per question category, including Uncategorized.
          </p>
        </div>
        <CategoryBreakdown data={data?.by_category ?? []} loading={isLoading} />
      </div>

    </div>
  );
}
