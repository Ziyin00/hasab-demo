"use client";

import type { LucideIcon } from "lucide-react";
import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toPercent, type ShareBreakdownItem } from "../utils/format";
import { ANALYTICS_COLORS, CHART_PALETTE } from "../constants";
import { EmptyState } from "./EmptyState";

export type { ShareBreakdownItem };

interface ShareBreakdownProps {
  data: ShareBreakdownItem[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  ranked?: boolean;
  mutedKeys?: ReadonlySet<string>;
  /** Use brand gradient for non-muted bars instead of the palette */
  accentGradient?: boolean;
}

export function ShareBreakdown({
  data,
  loading,
  emptyMessage = "No data for this period.",
  emptyIcon: EmptyIcon = BarChart2,
  ranked = false,
  mutedKeys,
  accentGradient = false,
}: ShareBreakdownProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState icon={EmptyIcon} message={emptyMessage} />;
  }

  const max = Math.max(...data.map((d) => d.conversations_count), 1);

  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const isMuted = mutedKeys?.has(d.key) ?? false;
        const color = CHART_PALETTE[i % CHART_PALETTE.length];

        return (
          <div key={d.key} className="group space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 truncate font-medium">
                {ranked ? (
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tabular-nums",
                      isMuted
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {i + 1}
                  </span>
                ) : (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full ring-2 ring-background"
                    style={{ background: color }}
                  />
                )}
                <span className={cn("truncate", isMuted && "text-muted-foreground")}>
                  {d.label}
                </span>
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {d.conversations_count.toLocaleString()} · {toPercent(d.share, 1)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/80">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  !isMuted && accentGradient && "group-hover:opacity-90"
                )}
                style={{
                  width: `${Math.max((d.conversations_count / max) * 100, 3)}%`,
                  background: isMuted
                    ? "var(--muted-foreground)"
                    : accentGradient
                      ? `linear-gradient(90deg, ${ANALYTICS_COLORS.primary}, ${ANALYTICS_COLORS.violet})`
                      : `linear-gradient(90deg, ${color}, ${color}cc)`,
                  opacity: isMuted ? 0.35 : 1,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
