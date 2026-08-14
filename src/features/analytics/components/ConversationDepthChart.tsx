"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { MessagesSquare } from "lucide-react";
import type { Conversation } from "../types/analytics.types";
import { ANALYTICS_COLORS } from "../constants";
import { ChartContainer } from "./ChartContainer";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const BUCKETS = [
  { key: "1", label: "1", min: 1, max: 1 },
  { key: "2-3", label: "2–3", min: 2, max: 3 },
  { key: "4-5", label: "4–5", min: 4, max: 5 },
  { key: "6-8", label: "6–8", min: 6, max: 8 },
  { key: "9-12", label: "9–12", min: 9, max: 12 },
  { key: "13+", label: "13+", min: 13, max: Infinity },
] as const;

interface ConversationDepthChartProps {
  conversations: Conversation[];
  avg: number | undefined;
  loading?: boolean;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function ConversationDepthChart({
  conversations,
  avg,
  loading,
}: ConversationDepthChartProps) {
  if (loading) return <Skeleton className="h-56 w-full rounded-xl" />;

  const counts = conversations.map((c) => c.message_count).filter((n) => n > 0);
  if (!counts.length) {
    return <EmptyState icon={MessagesSquare} message="No conversation depth yet." />;
  }

  const rows = BUCKETS.map((b) => ({
    label: b.label,
    count: counts.filter((n) => n >= b.min && n <= b.max).length,
  }));
  const peak = Math.max(...rows.map((r) => r.count));
  const med = median(counts);
  const longest = Math.max(...counts);

  return (
    <div className="flex h-full flex-col">
      <ChartContainer height={176}>
        <BarChart data={rows} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              fontSize: 12,
              background: "var(--card)",
            }}
            formatter={(value) => [Number(value ?? 0).toLocaleString(), "Conversations"]}
            labelFormatter={(label) => `${label} messages`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {rows.map((row) => (
              <Cell
                key={row.label}
                fill={
                  row.count === peak && peak > 0
                    ? ANALYTICS_COLORS.primary
                    : `${ANALYTICS_COLORS.primary}55`
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/40 pt-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Median</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">{med ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Average</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">
            {avg != null ? avg.toFixed(1) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Longest</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">{longest}</p>
        </div>
      </div>
    </div>
  );
}
