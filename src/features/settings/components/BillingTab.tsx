"use client";

import { useState } from "react";
import { Coins, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProfile } from "../hooks/useSettings";
import { TokenHistoryTable } from "./TokenHistoryTable";
import { TopUpDialog } from "./TopUpDialog";

export function BillingTab() {
  const { data: profile, isLoading } = useProfile();
  const [topUpOpen, setTopUpOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* Token balance */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Token balance</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tokens consumed across all services.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setTopUpOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Top Up
          </Button>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total tokens used</p>
              {isLoading ? (
                <Skeleton className="h-7 w-28 mt-0.5" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums">
                  {profile?.total_tokens?.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  }) ?? "—"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-sm font-semibold">Token history</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            All token top-ups and transactions on your account.
          </p>
        </div>
        <div className="px-6 py-5">
          <TokenHistoryTable />
        </div>
      </div>

      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  );
}
