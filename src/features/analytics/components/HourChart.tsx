"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Clock } from "lucide-react";
import type { HourBucket } from "../types/analytics.types";
import { Skeleton } from "@/components/ui/skeleton";
import { ANALYTICS_COLORS } from "../constants";
import { ChartContainer } from "./ChartContainer";
import { EmptyState } from "./EmptyState";

interface HourChartProps {
  data: HourBucket[];
  loading?: boolean;
}

export function HourChart({ data, loading }: HourChartProps) {
  if (loading) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  if (!data.length) {
    return <EmptyState icon={Clock} message="No hourly activity in this range." />;
  }

  const peakCount = Math.max(...data.map((d) => d.conversations_count));

  return (
    <ChartContainer height={176}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="hourBarPeak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ANALYTICS_COLORS.primary} stopOpacity={1} />
            <stop offset="100%" stopColor={ANALYTICS_COLORS.violet} stopOpacity={0.85} />
          </linearGradient>
          <linearGradient id="hourBarDefault" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ANALYTICS_COLORS.indigo} stopOpacity={0.7} />
            <stop offset="100%" stopColor={ANALYTICS_COLORS.indigo} stopOpacity={0.35} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-border/50"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
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
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
          formatter={(value) => [Number(value ?? 0).toLocaleString(), "Conversations"]}
          labelFormatter={(label) => `${label}`}
        />
        <Bar dataKey="conversations_count" name="conversations_count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.conversations_count === peakCount && peakCount > 0
                  ? "url(#hourBarPeak)"
                  : "url(#hourBarDefault)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
