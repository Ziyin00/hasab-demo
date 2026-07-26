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
  trend?: number;
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
}: StatCardProps) {
  const hasTrend = trend !== undefined && !subNeutral;

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4 relative overflow-hidden">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: iconColor, opacity: 0.5 }} />

      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground leading-none">
          {label}
        </p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
          style={{ background: iconColor + "18" }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-3xl font-bold tracking-tight leading-none">{value}</p>

          {hasTrend && trend !== undefined ? (
            <div className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              trend >= 0
                ? "bg-green-500/10 text-green-600"
                : "bg-red-500/10 text-red-500"
            )}>
              {trend >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />}
              {trend >= 0 ? "+" : ""}{trend.toFixed(1)}% this week
            </div>
          ) : sub ? (
            <p className={cn(
              "text-xs",
              subPositive ? "text-green-600" : "text-muted-foreground"
            )}>
              {sub}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
