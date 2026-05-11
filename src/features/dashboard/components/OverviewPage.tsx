"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  FileText,
  Mic,
  Video,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  MoreHorizontal,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Timer,
  Loader2,
  Languages,
  Volume2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAuthStore } from "@/store/auth.store";
import { RecentActivity } from "./RecentActivity";
import { cn } from "@/lib/utils";

/* ─── helpers ─── */
function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ─── stat card ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  accent,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: { value: string; positive: boolean };
  changeLabel?: string;
  accent?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="group relative flex flex-col justify-between gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-shadow hover:shadow-md sm:px-5 sm:py-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1.5 h-8 w-20 sm:h-10 sm:w-28" />
          ) : (
            <div className="mt-1 flex items-baseline gap-2 sm:mt-1.5">
              <p className="text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
              {change && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:text-xs",
                    change.positive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  {change.positive ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {change.value}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg sm:size-11",
            accent ?? "bg-muted",
          )}
        >
          <Icon className={cn("size-4 sm:size-5", accent ? "text-white" : "text-muted-foreground")} />
        </div>
      </div>
      {changeLabel && !isLoading && (
        <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
          <span className="text-[11px] text-muted-foreground sm:text-xs">{changeLabel}</span>
          <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      )}
    </div>
  );
}

/* ─── demo data for charts ─── */
const ACTIVITY_DATA = [
  { day: "Su", value: 45 },
  { day: "Mo", value: 52 },
  { day: "Tu", value: 48 },
  { day: "We", value: 68 },
  { day: "Th", value: 55 },
  { day: "Fr", value: 38 },
  { day: "Sa", value: 32 },
];

const HEALTH_DATA = [
  { name: "Success", value: 96.3, color: "#18181b" },
  { name: "Delayed", value: 2.5, color: "#a1a1aa" },
  { name: "Failed", value: 1.2, color: "#e4e4e7" },
];

/* ─── custom chart tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{payload[0].value}</p>
      <p className="text-[10px] text-emerald-500">↗ 1.25%</p>
    </div>
  );
}

/* ─── Integration Status Card ─── */
const INTEGRATIONS = [
  {
    name: "Transcription",
    icon: Mic,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    status: "Active",
    statusColor: "text-emerald-500",
  },
  {
    name: "Translation",
    icon: Languages,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    status: "Active",
    statusColor: "text-emerald-500",
  },
  {
    name: "Text to Speech",
    icon: Volume2,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    status: "Active",
    statusColor: "text-emerald-500",
  },
  {
    name: "Meeting Minutes",
    icon: Users,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    status: "Active",
    statusColor: "text-emerald-500",
  },
];

function IntegrationStatus() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
            <CheckCircle2 className="size-3.5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold">Service Status</h3>
        </div>
        <button className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <MoreHorizontal className="size-4" />
        </button>
      </div>
      <div className="divide-y divide-border">
        {INTEGRATIONS.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30 sm:px-5"
          >
            <div className="flex items-center gap-3">
              <div className={cn("flex size-9 items-center justify-center rounded-lg", item.iconBg)}>
                <item.icon className={cn("size-4", item.iconColor)} />
              </div>
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", item.statusColor === "text-emerald-500" ? "bg-emerald-500" : item.statusColor === "text-amber-500" ? "bg-amber-500" : "bg-red-500")} />
              <span className={cn("text-xs font-medium", item.statusColor)}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export function OverviewPage() {
  const { data, isLoading } = useAnalytics();
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = useMemo(() => {
    if (!mounted) return "";
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [mounted]);

  const currentTime = useMemo(() => {
    if (!mounted) return "";
    return new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [mounted]);

  const firstName = mounted && user?.name ? user.name.split(" ")[0] : "";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Welcome back{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Here&apos;s a quick summary of your usage today.
          </p>
        </div>
        {mounted && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                {today}, {currentTime}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4 Stat Cards ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Total Minutes"
          value={isLoading ? "—" : fmt(data?.total_minutes ?? 0, 1)}
          change={{ value: "12%", positive: true }}
          changeLabel="from last month"
          isLoading={isLoading}
        />
        <StatCard
          icon={FileText}
          label="Words Processed"
          value={isLoading ? "—" : fmt(data?.words_processed.total ?? 0)}
          change={{ value: "8%", positive: true }}
          changeLabel="from last month"
          accent="bg-zinc-800 dark:bg-zinc-700"
          isLoading={isLoading}
        />
        <StatCard
          icon={Mic}
          label="Audio Minutes"
          value={isLoading ? "—" : fmt(data?.audio_minutes ?? 0, 1)}
          change={{ value: "5%", positive: false }}
          changeLabel="from last month"
          isLoading={isLoading}
        />
        <StatCard
          icon={Video}
          label="Videos Processed"
          value={isLoading ? "—" : fmt(data?.videos_processed ?? 0)}
          change={{ value: "4%", positive: true }}
          changeLabel="from last month"
          isLoading={isLoading}
        />
      </div>

      {/* ─── Charts Row: Activity Trend + Execution Health ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Activity Trend */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
                <Timer className="size-3.5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold">Usage Activity Trend</h3>
            </div>
            <button className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <MoreHorizontal className="size-4" />
            </button>
          </div>
          <div className="px-2 py-4 sm:px-4 sm:py-5">
            <div className="h-[240px] w-full sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ACTIVITY_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      {/* Using var(--foreground) directly so it picks up the OKLCH values from your CSS */}
                      <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="1 1"
                    stroke="var(--border)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    dy={8}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    domain={[0, 100]}
                    ticks={[0, 20, 50, 75, 100]}
                  />

                  <RechartsTooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "var(--foreground)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--foreground)"
                    strokeWidth={1}
                    fill="url(#areaGrad)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "var(--foreground)",
                      stroke: "var(--background)",
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Execution Health / Donut */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
                <CheckCircle2 className="size-3.5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold">Execution Health</h3>
            </div>
            <button className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <MoreHorizontal className="size-4" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center px-4 py-6 sm:px-5 sm:py-8">
            <div className="relative h-[180px] w-[180px] sm:h-[200px] sm:w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={HEALTH_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="90%"
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {HEALTH_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold sm:text-3xl">96.3%</span>
                <span className="mt-0.5 flex items-center gap-0.5 text-xs font-medium text-emerald-500">
                  <ArrowUpRight className="size-3" /> 12%
                </span>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs sm:gap-6 sm:text-sm">
              {HEALTH_DATA.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground sm:text-xs">
              Health is calculated based on the past 7 days execution
            </p>
          </div>
        </div>
      </div>

      {/* ─── Integration Status + Recent Workflows ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <IntegrationStatus />
        </div>
        <div className="lg:col-span-3">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
