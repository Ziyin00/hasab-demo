"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { Clock } from "lucide-react";
import type { HourBucket } from "../types/analytics.types";
import { Skeleton } from "@/components/ui/skeleton";
import { ANALYTICS_COLORS } from "../constants";
import { ChartContainer } from "./ChartContainer";
import { EmptyState } from "./EmptyState";

interface PeakHoursChartProps {
  data: HourBucket[];
  loading?: boolean;
}

export function PeakHoursChart({ data, loading }: PeakHoursChartProps) {
  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const total = data.reduce((sum, d) => sum + d.conversations_count, 0);
  if (!data.length || total === 0) {
    return <EmptyState icon={Clock} message="No hourly activity in this range." />;
  }
  const peak = data.reduce((best, d) =>
    d.conversations_count > best.conversations_count ? d : best
  );
  const peakShare = total > 0 ? Math.round((peak.conversations_count / total) * 100) : 0;
  const quiet = data.filter((d) => d.conversations_count === 0).length;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: ANALYTICS_COLORS.primary }}
          />
          Conversations
        </span>
        <span className="ml-auto">
          Peak{" "}
          <span className="font-medium text-foreground">{peak.label}</span>
          {peakShare > 0 ? ` — ${peakShare}% of conversations` : ""}
          {quiet > 0 ? ` · ${quiet} quiet hours` : ""}
        </span>
      </div>

      <ChartContainer height={248}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="trafficHourPeak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ANALYTICS_COLORS.primary} stopOpacity={1} />
              <stop offset="100%" stopColor={ANALYTICS_COLORS.violet} stopOpacity={0.85} />
            </linearGradient>
            <linearGradient id="trafficHourDefault" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ANALYTICS_COLORS.primary} stopOpacity={0.45} />
              <stop offset="100%" stopColor={ANALYTICS_COLORS.primary} stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-border/40"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval={2}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              fontSize: 12,
              background: "var(--card)",
            }}
            formatter={(value) => [Number(value ?? 0).toLocaleString(), "Conversations"]}
          />
          <ReferenceLine
            x={peak.label}
            stroke={ANALYTICS_COLORS.primary}
            strokeDasharray="4 4"
            strokeOpacity={0.35}
          />
          <Bar dataKey="conversations_count" name="Conversations" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.hour}
                fill={
                  entry.conversations_count === peak.conversations_count &&
                  peak.conversations_count > 0
                    ? "url(#trafficHourPeak)"
                    : "url(#trafficHourDefault)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
