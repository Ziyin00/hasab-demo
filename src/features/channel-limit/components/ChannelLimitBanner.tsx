"use client";

import { AlertCircle, Layers } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChannelLimit } from "../hooks/useChannelLimit";

interface ChannelLimitBannerProps {
  className?: string;
  compact?: boolean;
}

export function ChannelLimitBanner({ className, compact }: ChannelLimitBannerProps) {
  const { data: limit, isLoading, isError } = useChannelLimit();

  if (isLoading) {
    return compact ? null : <Skeleton className={cn("h-16 w-full rounded-xl", className)} />;
  }

  if (isError || !limit) return null;

  const atLimit = limit.remaining <= 0;

  return (
    <Alert
      variant={atLimit ? "destructive" : "default"}
      className={cn(
        "rounded-xl border",
        !atLimit && "border-[var(--lp-border)] bg-muted/30",
        className
      )}
    >
      {atLimit ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Layers className="h-4 w-4 text-primary" />
      )}
      <AlertTitle className="text-sm font-semibold">
        {atLimit ? "Channel limit reached" : "Channel usage"}
      </AlertTitle>
      <AlertDescription className="text-xs leading-relaxed">
        {atLimit ? (
          <>
            You&apos;ve used all {limit.limit} slots ({limit.widgets} widget
            {limit.widgets === 1 ? "" : "s"}, {limit.telegram_bots} Telegram bot
            {limit.telegram_bots === 1 ? "" : "s"}). Delete an existing widget or bot to
            create a new one, or contact support to increase your limit.
          </>
        ) : (
          <>
            {limit.used} of {limit.limit} channels used — {limit.widgets} widget
            {limit.widgets === 1 ? "" : "s"}, {limit.telegram_bots} Telegram bot
            {limit.telegram_bots === 1 ? "" : "s"}. {limit.remaining} slot
            {limit.remaining === 1 ? "" : "s"} remaining.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
