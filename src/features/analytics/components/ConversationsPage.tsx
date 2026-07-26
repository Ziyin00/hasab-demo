"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ConversationInbox } from "./ConversationInbox";
import type { AnalyticsRange } from "../types/analytics.types";

const RANGES: { label: string; value: AnalyticsRange }[] = [
  { label: "7D", value: "7d" },
  { label: "14D", value: "14d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
];

export function ConversationsPage() {
  const [range, setRange] = useState<AnalyticsRange>("30d");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Conversations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse, search, and filter all visitor conversations.
          </p>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                range === r.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ConversationInbox range={range} />
    </div>
  );
}
