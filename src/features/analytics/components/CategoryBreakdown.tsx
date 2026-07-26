"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryBreakdown as CategoryBreakdownItem } from "../types/analytics.types";

interface CategoryBreakdownProps {
  data: CategoryBreakdownItem[];
  loading?: boolean;
}

export function CategoryBreakdown({ data, loading }: CategoryBreakdownProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        No categorized conversations in this range yet.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.conversations_count), 1);

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const isUncategorized = d.category_id === null;
        return (
          <div key={d.slug} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className={cn("font-medium truncate", isUncategorized && "text-muted-foreground")}>
                {d.name}
              </span>
              <span className="text-muted-foreground tabular-nums shrink-0">
                {d.conversations_count.toLocaleString()} · {d.share.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  isUncategorized ? "bg-muted-foreground/40" : "bg-amber-500"
                )}
                style={{ width: `${Math.max((d.conversations_count / max) * 100, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
