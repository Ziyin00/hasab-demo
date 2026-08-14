"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsPanelProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** Highlights the panel with a subtle brand tint */
  accent?: boolean;
  action?: React.ReactNode;
}

export function AnalyticsPanel({
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
  accent = false,
  action,
}: AnalyticsPanelProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md",
        accent && "border-primary/15 bg-gradient-to-br from-primary/[0.03] via-card to-card",
        className
      )}
    >
      {accent && (
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.07] blur-2xl"
          style={{ background: "var(--primary)" }}
        />
      )}

      <div className="relative border-b border-border/40 px-4 py-2.5">
        <div className="flex items-start gap-2.5">
          {Icon && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
              {action}
            </div>
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={cn("relative p-4", contentClassName)}>{children}</div>
    </div>
  );
}
