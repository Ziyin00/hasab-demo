"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { LineChart } from "lucide-react";
import type { TrendPoint } from "../types/analytics.types";
import { ANALYTICS_COLORS } from "../constants";
import { ChartContainer } from "./ChartContainer";
import { EmptyState } from "./EmptyState";

interface DailyVolumeChartProps {
  data: TrendPoint[];
}

const SERIES = [
  { key: "messages", label: "Messages", color: ANALYTICS_COLORS.primary },
  { key: "conversations_replied", label: "Replied", color: ANALYTICS_COLORS.violet },
  { key: "conversations_abandoned", label: "Abandoned", color: "#94A3B8" },
] as const;

function peakDay(data: TrendPoint[]) {
  if (!data.length) return null;
  const total = data.reduce((sum, d) => sum + d.messages, 0);
  if (total <= 0) return null;
  const peak = data.reduce((best, d) => (d.messages > best.messages ? d : best), data[0]);
  const share = Math.round((peak.messages / total) * 100);
  if (share < 15) return null;
  return { ...peak, share };
}

export function DailyVolumeChart({ data }: DailyVolumeChartProps) {
  const hasVolume = data.some(
    (d) => d.messages > 0 || d.conversations_replied > 0 || d.conversations_abandoned > 0
  );
  if (!data.length || !hasVolume) {
    return <EmptyState icon={LineChart} message="No volume data for this period." />;
  }

  const peak = peakDay(data);
  const abandonedTotal = data.reduce((sum, d) => sum + d.conversations_abandoned, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {SERIES.map((s) => (
          <div key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.key === "conversations_abandoned"
              ? `${s.label} · ${abandonedTotal}`
              : s.label}
          </div>
        ))}
        {peak && (
          <p className="ml-auto text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{peak.label}</span>
            {" — "}
            {peak.share}% of all messages in the period
          </p>
        )}
      </div>

      <ChartContainer height={248}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="vol-messages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ANALYTICS_COLORS.primary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={ANALYTICS_COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="vol-replied" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ANALYTICS_COLORS.violet} stopOpacity={0.18} />
              <stop offset="100%" stopColor={ANALYTICS_COLORS.violet} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              fontSize: 12,
              background: "var(--card)",
            }}
          />
          {peak && (
            <ReferenceLine
              x={peak.label}
              stroke={ANALYTICS_COLORS.primary}
              strokeDasharray="4 4"
              strokeOpacity={0.45}
            />
          )}
          <Area
            type="monotone"
            dataKey="messages"
            name="Messages"
            stroke={ANALYTICS_COLORS.primary}
            strokeWidth={2}
            fill="url(#vol-messages)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="conversations_replied"
            name="Replied"
            stroke={ANALYTICS_COLORS.violet}
            strokeWidth={1.75}
            fill="url(#vol-replied)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="conversations_abandoned"
            name="Abandoned"
            stroke="#94A3B8"
            strokeWidth={1.5}
            fill="transparent"
            dot={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
