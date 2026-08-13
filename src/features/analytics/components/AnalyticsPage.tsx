"use client";

import { useMemo, useState } from "react";
import {
  MessageSquare,
  Users,
  Clock,
  ThumbsUp,
  UserCheck,
  BarChart3,
  Layers,
  Globe,
  Smartphone,
  Timer,
  CheckCircle2,
  Activity,
  CalendarRange,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "./StatCard";
import { TrendChart } from "./TrendChart";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { ShareBreakdown } from "./ShareBreakdown";
import { HourChart } from "./HourChart";
import { TopPagesTable } from "./TopPagesTable";
import { ClassificationCoverageBar } from "./ClassificationCoverageBar";
import { WidgetStatusCard } from "./WidgetStatusCard";
import { ResponseTimePanel } from "./ResponseTimePanel";
import { EngagementOverview } from "./EngagementOverview";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { useAnalytics } from "../hooks/useAnalytics";
import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import { cn } from "@/lib/utils";
import { toPercent, toShareItems, formatSourceLabel, formatLanguageLabel, formatDeviceLabel } from "../utils/format";
import { ANALYTICS_COLORS } from "../constants";
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
  const { data, isLoading } = useAnalytics(
    range,
    widgetId !== "all" ? Number(widgetId) : undefined
  );

  const summary = data?.summary;

  const sourceItems = useMemo(
    () => toShareItems(data?.by_source, (d) => d.source, (d) => formatSourceLabel(d.source)),
    [data?.by_source]
  );

  const languageItems = useMemo(
    () => toShareItems(data?.by_language, (d) => d.language, (d) => formatLanguageLabel(d.language)),
    [data?.by_language]
  );

  const deviceItems = useMemo(
    () =>
      toShareItems(data?.by_device, (d) => d.device_type, (d) => formatDeviceLabel(d.device_type)),
    [data?.by_device]
  );

  const periodLabel = data ? `${data.from} → ${data.to}` : undefined;
  const selectedWidget = widgets?.find((w) => String(w.id) === widgetId);

  return (
    <div className="space-y-4 pb-1">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/[0.06] via-card to-card p-4 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
              Conversation volume, engagement quality, and widget health — all in one place.
            </p>
            {periodLabel && (
              <Badge variant="secondary" className="gap-1.5 font-normal">
                <CalendarRange className="h-3 w-3" />
                {periodLabel}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={widgetId} onValueChange={setWidgetId}>
              <SelectTrigger className="h-9 w-full sm:w-44 bg-background/80 backdrop-blur-sm">
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

            <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-background/80 p-1 backdrop-blur-sm">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                    range === r.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedWidget && (
          <p className="relative mt-2 text-xs text-muted-foreground">
            Filtering by <span className="font-medium text-foreground">{selectedWidget.name}</span>
          </p>
        )}
      </div>

      {/* Primary KPIs */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Overview
        </h2>
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
              summary
                ? `${summary.returning_visitors.toLocaleString()} returning`
                : undefined
            }
            subNeutral
            loading={isLoading}
          />
        </div>
      </section>

      {/* Engagement & Trends */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Engagement & Trends
        </h2>
        <div className="grid gap-3 lg:grid-cols-5 lg:items-stretch">
          <AnalyticsPanel
            title="Conversation trends"
            description="Messages, replied conversations, and abandoned conversations over time."
            icon={BarChart3}
            className="lg:col-span-3 h-full"
          >
            <div className="min-h-[16rem]">
              {isLoading ? (
                <div className="h-64 rounded-xl bg-muted/40 animate-pulse" />
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
            className="lg:col-span-2 h-full"
          >
            <EngagementOverview summary={summary} loading={isLoading} />
          </AnalyticsPanel>
        </div>
      </section>

      {/* Breakdowns */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Breakdowns
        </h2>
        <div className="grid gap-3 lg:grid-cols-5">
          <AnalyticsPanel
            title="By category"
            description="Share of conversations per question category."
            icon={Layers}
            className="lg:col-span-3"
          >
            <CategoryBreakdown data={data?.by_category ?? []} loading={isLoading} />
          </AnalyticsPanel>

          <div className="grid gap-3 lg:col-span-2">
            <AnalyticsPanel
              title="By source"
              description="Widget vs dashboard traffic."
              icon={Globe}
            >
              <ShareBreakdown
                data={sourceItems}
                loading={isLoading}
                emptyMessage="No source breakdown available."
              />
            </AnalyticsPanel>
            <AnalyticsPanel title="By language" description="Conversation language distribution.">
              <ShareBreakdown
                data={languageItems}
                loading={isLoading}
                emptyMessage="No language data available."
              />
            </AnalyticsPanel>
          </div>
        </div>
      </section>

      {/* Traffic patterns */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Traffic patterns
        </h2>
        <div className="grid gap-3 lg:grid-cols-3">
          <AnalyticsPanel
            title="By device"
            description="From widget client metadata."
            icon={Smartphone}
          >
            <ShareBreakdown
              data={deviceItems}
              loading={isLoading}
              emptyMessage="No device data available."
            />
          </AnalyticsPanel>

          <AnalyticsPanel
            title="Peak hours"
            description="Conversations by hour of day. Peak hour highlighted."
            icon={Clock}
          >
            <div className="min-h-[11rem] min-w-0">
              <HourChart data={data?.by_hour ?? []} loading={isLoading} />
            </div>
          </AnalyticsPanel>

          <AnalyticsPanel
            title="Top pages"
            description="Top embed URLs by conversation count."
            icon={Globe}
          >
            <TopPagesTable data={data?.top_pages ?? []} loading={isLoading} />
          </AnalyticsPanel>
        </div>
      </section>

      {/* Health & performance */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Health & performance
        </h2>
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
      </section>

      {data?.last_updated && (
        <p className="text-xs text-muted-foreground text-right">
          Last updated {new Date(data.last_updated).toLocaleString()}
        </p>
      )}
    </div>
  );
}
