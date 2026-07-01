"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subPositive?: boolean;
  loading?: boolean;
}

export function StatCard({ label, value, sub, subPositive, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      )}
      {sub && !loading && (
        <p
          className={cn(
            "mt-1 text-xs",
            subPositive ? "text-green-600" : "text-muted-foreground"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
