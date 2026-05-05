"use client";

import { useState } from "react";
import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTotalTokens } from "../hooks/useTotalTokens";
import { TopUpDialog } from "./TopUpDialog";
import { TransactionTable } from "./TransactionTable";

export function BillingPage() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { data: totalTokens, isLoading: tokensLoading } = useTotalTokens();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Available Credits</p>
            {tokensLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <p className="text-3xl font-bold tracking-tight">
                {(totalTokens ?? 0).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              tokens available across all services
            </p>
          </div>
        </div>
        <Button onClick={() => setTopUpOpen(true)} className="gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" />
          Top Up
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Transaction History</h2>
          <p className="text-sm text-muted-foreground">Your recent credit top-up activities.</p>
        </div>
        <TransactionTable />
      </div>

      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  );
}
