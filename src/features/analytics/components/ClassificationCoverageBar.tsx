"use client";

import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassificationCoverage } from "../types/analytics.types";
import { ANALYTICS_COLORS } from "../constants";
import { EmptyState } from "./EmptyState";

interface ClassificationCoverageBarProps {
  data: ClassificationCoverage | undefined;
  loading?: boolean;
}

export function ClassificationCoverageBar({ data, loading }: ClassificationCoverageBarProps) {
  if (loading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  if (!data || data.total === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        message="No conversations to classify in this range."
      />
    );
  }

  const width = Math.max(data.percent * 100, 2);
  const unclassified = data.total - data.classified;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${ANALYTICS_COLORS.green} ${width * 3.6}deg, var(--muted) 0deg)`,
        }}
      >
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-card">
          <span className="text-sm font-bold tabular-nums leading-none">{data.display}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">Classified conversations</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">
            {data.classified.toLocaleString()}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {data.total.toLocaleString()}
          </span>{" "}
          have a category assigned.
        </p>
        {unclassified > 0 && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            {unclassified.toLocaleString()} still uncategorized
          </p>
        )}
      </div>
    </div>
  );
}
