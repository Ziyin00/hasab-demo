"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subPositive?: boolean;
  subNeutral?: boolean;
  loading?: boolean;
  icon: ReactNode;
  iconColor: string;
  trend?: number | null;
  /** When true, negative trend is shown as positive (e.g. response time). */
  invertTrend?: boolean;
  trendLabel?: string;
}

export function StatCard({
  label,
  value,
  sub,
  subPositive,
  subNeutral,
  loading,
  icon,
  iconColor,
  trend,
  invertTrend = false,
  trendLabel = "vs prior period",
}: StatCardProps) {
  const hasTrend = trend != null && !subNeutral;
  const trendPositive = invertTrend ? (trend ?? 0) <= 0 : (trend ?? 0) >= 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-[0.14]"
        style={{ background: iconColor }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">
          {label}
        </p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ring-1 ring-black/[0.04]"
          style={{ background: iconColor + "14" }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>

      {loading ? (
        <div className="relative mt-2.5 space-y-1.5">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : (
        <div className="relative mt-2.5 space-y-1.5">
          <p className="text-2xl font-bold tracking-tight leading-none tabular-nums">{value}</p>

          {hasTrend ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                trendPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              {(trend ?? 0) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {(trend ?? 0) >= 0 ? "+" : ""}
              {trend?.toFixed(1)}% {trendLabel}
            </div>
          ) : sub ? (
            <p
              className={cn(
                "text-xs leading-relaxed",
                subPositive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}
            >
              {sub}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
