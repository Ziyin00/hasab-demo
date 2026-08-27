"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryBreakdown } from "../types/analytics.types";
import { ANALYTICS_COLORS, CHART_PALETTE } from "../constants";
import { toPercent } from "../utils/format";
import { EmptyState } from "./EmptyState";
import { Tags } from "lucide-react";

interface CategoriesPanelProps {
  data: CategoryBreakdown[];
  classified: number;
  total: number;
  loading?: boolean;
}

export function CategoriesPanel({ data, classified, total, loading }: CategoriesPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!data.length || total === 0) {
    return <EmptyState icon={Tags} message="No categorized conversations in this range yet." />;
  }

  const categorized = data.filter((d) => d.category_id != null && d.conversations_count > 0);
  const uncategorized = data.find((d) => d.category_id == null);
  const uncategorizedCount = uncategorized?.conversations_count ?? Math.max(total - classified, 0);
  const uncategorizedShare = total > 0 ? uncategorizedCount / total : 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground">{classified}</span>
        {" of "}
        <span className="font-semibold tabular-nums text-foreground">{total}</span>
        {" classified"}
      </p>

      <div className="space-y-3">
        {categorized.map((row, i) => (
          <div key={row.slug} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium">{row.name}</span>
              <span className="tabular-nums text-muted-foreground">{toPercent(row.share, 0)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(row.share * 100, 2)}%`,
                  background: CHART_PALETTE[i % CHART_PALETTE.length],
                }}
              />
            </div>
          </div>
        ))}

        {uncategorizedCount > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-muted-foreground">Uncategorized</span>
              <span className="tabular-nums text-muted-foreground">
                {toPercent(uncategorizedShare, 0)}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, var(--muted) 0 6px, color-mix(in oklab, var(--muted-foreground) 18%, transparent) 6px 8px)",
              }}
            >
              <div
                className="h-full rounded-full bg-muted-foreground/25"
                style={{ width: `${Math.max(uncategorizedShare * 100, 2)}%` }}
              />
            </div>
            <Link
              href="/dashboard/analytics/conversations"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              style={{ color: ANALYTICS_COLORS.primary }}
            >
              Classify these {uncategorizedCount}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
