"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  Clock,
  ThumbsUp,
  UserCheck,
  BarChart3,
  Timer,
  CheckCircle2,
  Activity,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "./StatCard";
import { TrendChart } from "./TrendChart";
import { TopPagesTable } from "./TopPagesTable";
import { ClassificationCoverageBar } from "./ClassificationCoverageBar";
import { WidgetStatusCard } from "./WidgetStatusCard";
import { ResponseTimePanel } from "./ResponseTimePanel";
import { EngagementOverview } from "./EngagementOverview";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { DailyVolumeChart } from "./DailyVolumeChart";
import { CategoriesPanel } from "./CategoriesPanel";
import { ConversationDepthChart } from "./ConversationDepthChart";
import { RecentConversationsTable } from "./RecentConversationsTable";
import { PeakHoursChart } from "./PeakHoursChart";
import { TrafficSharePanel } from "./TrafficSharePanel";
import { useAnalytics } from "../hooks/useAnalytics";
import { useConversations } from "../hooks/useConversations";
import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import { cn } from "@/lib/utils";
import {
  toPercent,
  toShareItems,
  formatSourceLabel,
  formatLanguageLabel,
  formatDeviceLabel,
} from "../utils/format";
import { ANALYTICS_COLORS } from "../constants";
import type { AnalyticsRange } from "../types/analytics.types";

const RANGES: { label: string; value: AnalyticsRange }[] = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

type AnalyticsTab = "overview" | "conversations" | "traffic" | "health";

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "conversations", label: "Conversations" },
  { id: "traffic", label: "Traffic" },
  { id: "health", label: "Health" },
];

function MetricStrip({
  items,
  loading,
}: {
  items: { label: string; value: string | number | null | undefined }[];
  loading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((metric) => (
        <div key={metric.label} className="bg-card px-4 py-3">
          <p className="text-[11px] text-muted-foreground">{metric.label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-6 w-12" />
          ) : (
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
              {metric.value == null || metric.value === "" ? "—" : metric.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [widgetId, setWidgetId] = useState("all");
  const [tab, setTab] = useState<AnalyticsTab>("conversations");
  const { data: widgets } = useChatbotWidgets();
  const widgetFilter = widgetId !== "all" ? Number(widgetId) : undefined;
  const { data, isLoading } = useAnalytics(range, widgetFilter);
  const { data: convData, isLoading: convLoading } = useConversations({
    range,
    page: 1,
    per_page: 100,
    chatbot_widget_id: widgetFilter,
  });

  const summary = data?.summary;
  const conversations = convData?.conversations ?? [];
  const recent = conversations.slice(0, 6);

  const sourceItems = useMemo(
    () => toShareItems(data?.by_source, (d) => d.source, (d) => formatSourceLabel(d.source)),
    [data?.by_source]
  );
  const languageItems = useMemo(
    () =>
      toShareItems(data?.by_language, (d) => d.language, (d) => formatLanguageLabel(d.language)),
    [data?.by_language]
  );
  const deviceItems = useMemo(
    () =>
      toShareItems(data?.by_device, (d) => d.device_type, (d) => formatDeviceLabel(d.device_type)),
    [data?.by_device]
  );

  const classified = data?.classification_coverage?.classified ?? 0;
  const totalConversations = summary?.total_conversations ?? 0;

  return (
    <div className="space-y-3 pb-2">
      <div>
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Volume, quality, and widget health for the selected period.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-end sm:justify-between">
        <nav className="-mb-px flex gap-5 overflow-x-auto">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative pb-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                tab === item.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
              {tab === item.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2 pb-2 sm:justify-end">
          <Select value={widgetId} onValueChange={setWidgetId}>
            <SelectTrigger className="h-8 w-[9.5rem] border-border/60 bg-background text-sm">
              <SelectValue placeholder="All widgets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All widgets</SelectItem>
              {(widgets ?? []).map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
            <SelectTrigger className="h-8 w-40 border-border/60 bg-background text-sm">
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
      </div>

      {tab === "conversations" && (
        <div className="space-y-4">
          <MetricStrip
            loading={isLoading}
            items={[
              { label: "Conversations", value: summary?.total_conversations.toLocaleString() },
              { label: "Messages", value: summary?.total_messages.toLocaleString() },
              {
                label: "Msgs / conversation",
                value: summary?.avg_messages_per_conversation.toFixed(1),
              },
              { label: "Replied", value: summary?.conversations_replied.toLocaleString() },
              { label: "Abandoned", value: summary?.conversations_abandoned.toLocaleString() },
            ]}
          />

          <AnalyticsPanel title="Daily volume">
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <DailyVolumeChart data={data?.trend ?? []} />
            )}
          </AnalyticsPanel>

          <div className="grid gap-3 lg:grid-cols-2">
            <AnalyticsPanel title="Categories">
              <CategoriesPanel
                data={data?.by_category ?? []}
                classified={classified}
                total={totalConversations}
                loading={isLoading}
              />
            </AnalyticsPanel>
            <AnalyticsPanel title="Conversation depth">
              <ConversationDepthChart
                conversations={conversations}
                avg={summary?.avg_messages_per_conversation}
                loading={convLoading}
              />
            </AnalyticsPanel>
          </div>

          <AnalyticsPanel
            title="Recent conversations"
            action={
              <Link
                href="/dashboard/analytics/conversations"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all {convData?.pagination.total ?? totalConversations}
              </Link>
            }
            contentClassName="p-0"
          >
            <RecentConversationsTable conversations={recent} loading={convLoading} />
          </AnalyticsPanel>
        </div>
      )}

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Conversations"
              icon={<Users className="h-4 w-4" />}
              iconColor={ANALYTICS_COLORS.primary}
              value={summary ? summary.total_conversations.toLocaleString() : "—"}
              trend={summary?.changes.conversations_percent}
              loading={isLoading}
            />
            <StatCard
              label="Messages"
              icon={<MessageSquare className="h-4 w-4" />}
              iconColor={ANALYTICS_COLORS.violet}
              value={summary ? summary.total_messages.toLocaleString() : "—"}
              trend={summary?.changes.messages_percent}
              loading={isLoading}
            />
            <StatCard
              label="Satisfaction"
              icon={<ThumbsUp className="h-4 w-4" />}
              iconColor={ANALYTICS_COLORS.green}
              value={toPercent(summary?.satisfaction_rate, 0)}
              sub={
                summary && summary.satisfaction_sample_size > 0
                  ? `${summary.satisfaction_sample_size} ratings · ${summary.positive_ratings}↑ ${summary.negative_ratings}↓`
                  : "No ratings yet"
              }
              subPositive={summary?.satisfaction_rate != null && summary.satisfaction_rate >= 0.5}
              trend={summary?.changes.satisfaction_percent}
              loading={isLoading}
            />
            <StatCard
              label="Avg. Response"
              icon={<Clock className="h-4 w-4" />}
              iconColor={ANALYTICS_COLORS.sky}
              value={summary?.avg_response_time_display ?? "—"}
              trend={summary?.changes.response_time_percent}
              invertTrend
              loading={isLoading}
            />
            <StatCard
              label="Visitors"
              icon={<UserCheck className="h-4 w-4" />}
              iconColor={ANALYTICS_COLORS.teal}
              value={summary ? summary.unique_visitors.toLocaleString() : "—"}
              sub={
                summary ? `${summary.returning_visitors.toLocaleString()} returning` : undefined
              }
              subNeutral
              loading={isLoading}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-5 lg:items-stretch">
            <AnalyticsPanel
              title="Conversation trends"
              description="Messages, replied conversations, and abandoned conversations over time."
              icon={BarChart3}
              className="h-full lg:col-span-3"
            >
              <div className="min-h-[16rem]">
                {isLoading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <TrendChart data={data?.trend ?? []} />
                )}
              </div>
            </AnalyticsPanel>
            <AnalyticsPanel
              title="Engagement breakdown"
              description="Reply rate and average conversation depth."
              icon={Activity}
              accent
              className="h-full lg:col-span-2"
            >
              <EngagementOverview summary={summary} loading={isLoading} />
            </AnalyticsPanel>
          </div>
        </div>
      )}

      {tab === "traffic" && (
        <div className="space-y-4">
          <MetricStrip
            loading={isLoading}
            items={[
              { label: "Visitors", value: summary?.unique_visitors.toLocaleString() },
              { label: "Returning", value: summary?.returning_visitors.toLocaleString() },
              {
                label: "Returning share",
                value:
                  summary && summary.unique_visitors > 0
                    ? toPercent(summary.returning_visitors / summary.unique_visitors, 0)
                    : "—",
              },
              {
                label: "Top source",
                value: sourceItems[0]?.label ?? "—",
              },
              {
                label: "Top device",
                value: deviceItems[0]?.label ?? "—",
              },
            ]}
          />

          <AnalyticsPanel title="Peak hours">
            <PeakHoursChart data={data?.by_hour ?? []} loading={isLoading} />
          </AnalyticsPanel>

          <div className="grid gap-3 lg:grid-cols-2">
            <AnalyticsPanel title="By source">
              <TrafficSharePanel
                data={sourceItems}
                loading={isLoading}
                emptyMessage="No source breakdown available."
              />
            </AnalyticsPanel>
            <AnalyticsPanel title="By language">
              <TrafficSharePanel
                data={languageItems}
                loading={isLoading}
                emptyMessage="No language data available."
              />
            </AnalyticsPanel>
          </div>

          <AnalyticsPanel title="Top pages" contentClassName="p-0">
            <TopPagesTable data={data?.top_pages ?? []} loading={isLoading} />
          </AnalyticsPanel>
        </div>
      )}

      {tab === "health" && (
        <div className="grid gap-3 lg:grid-cols-3">
          <AnalyticsPanel
            title="Response time"
            description="Assistant message latency distribution."
            icon={Timer}
          >
            <ResponseTimePanel data={data?.response_time} loading={isLoading} />
          </AnalyticsPanel>
          <AnalyticsPanel
            title="Classification coverage"
            description="How many conversations have a category."
            icon={CheckCircle2}
          >
            <ClassificationCoverageBar
              data={data?.classification_coverage}
              loading={isLoading}
            />
          </AnalyticsPanel>
          <AnalyticsPanel
            title="Widget health"
            description="Recent activity and classification backlog."
            icon={Activity}
          >
            <WidgetStatusCard data={data?.widget_status} loading={isLoading} />
          </AnalyticsPanel>
        </div>
      )}

      {data?.last_updated ? (
        <p className="text-right text-xs text-muted-foreground">
          Last updated {new Date(data.last_updated).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
