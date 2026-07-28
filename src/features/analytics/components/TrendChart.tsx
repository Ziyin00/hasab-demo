"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LineChart } from "lucide-react";
import type { TrendPoint } from "../types/analytics.types";
import { toPercent } from "../utils/format";
import { ANALYTICS_COLORS } from "../constants";
import { EmptyState } from "./EmptyState";

interface TooltipEntry {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const SERIES = [
  { key: "messages", label: "Messages", color: ANALYTICS_COLORS.violet },
  { key: "conversations_replied", label: "Replied", color: ANALYTICS_COLORS.primary },
  { key: "conversations_abandoned", label: "Abandoned", color: ANALYTICS_COLORS.orange },
] as const;

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const satisfaction = payload.find((p) => p.dataKey === "satisfaction_rate");

  return (
    <div className="rounded-xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-sm px-4 py-3 space-y-1.5 text-xs max-w-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload
        .filter((p) => p.dataKey !== "satisfaction_rate")
        .map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: p.color }}
              />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {p.value?.toLocaleString()}
            </span>
          </div>
        ))}
      {satisfaction?.value != null && (
        <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-border/50">
          <span className="text-muted-foreground">Satisfaction</span>
          <span className="font-semibold tabular-nums text-foreground">
            {toPercent(satisfaction.value as number, 1)}
          </span>
        </div>
      )}
    </div>
  );
}

interface TrendChartProps {
  data: TrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState icon={LineChart} message="No trend data for this period." />;
  }

  const chartData = data.map((d) => ({
    ...d,
    satisfaction_rate: d.satisfaction_rate ?? undefined,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {SERIES.map((s) => (
          <div
            key={s.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[11px] font-medium"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-border/50"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 2" }}
            />

            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
