"use client";

import { RefreshCw, ShieldX, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequestAccess } from "../hooks/useContextAccess";
import type { ContextAccessStatus } from "../types/context.types";

interface Props {
  status: ContextAccessStatus | undefined;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function AccessRequestCard({ status, onRefresh, isRefreshing }: Props) {
  const { mutate: requestAccess, isPending } = useRequestAccess();
  const requestStatus = status?.request?.status ?? status?.request_status ?? "none";
  const isPendingRequest = requestStatus === "pending";

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
          <ShieldX className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Context Access Required</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            You need permission to manage AI contexts. Request access to get started.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary">
          {isPendingRequest ? "Request Pending" : "No Access"}
        </Badge>
        {status?.request?.admin_notes && (
          <p className="text-sm text-muted-foreground">
            Admin note: {status.request.admin_notes}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={() => requestAccess()} disabled={isPending || isPendingRequest}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : isPendingRequest ? (
            "Request Pending"
          ) : (
            "Request Access"
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh status"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
