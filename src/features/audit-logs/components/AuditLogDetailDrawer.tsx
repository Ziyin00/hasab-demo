"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogDetail } from "../hooks/useAuditLogs";
import {
  actionLabel,
  diffFields,
  eventSummary,
  formatActor,
  formatAuthMethod,
  formatTimestamp,
  resourceTypeLabel,
} from "../utils/format";
import { AuditDiff } from "./AuditDiff";

interface AuditLogDetailDrawerProps {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailDrawer({
  id,
  open,
  onOpenChange,
}: AuditLogDetailDrawerProps) {
  const { data, isLoading, isError, error } = useAuditLogDetail(open ? id : null);
  const diffs = data ? diffFields(data.old_values, data.new_values) : [];
  const authLabel = data ? formatAuthMethod(data.auth_method) : null;
  const notFound =
    isError &&
    ((error as { response?: { status?: number } })?.response?.status === 404 ||
      String((error as Error)?.message ?? "").toLowerCase().includes("not found"));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Activity detail</SheetTitle>
          <SheetDescription>
            Full change snapshot for this audit event.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 px-1">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          )}

          {notFound && (
            <p className="text-sm text-muted-foreground">
              Entry not found or you don&apos;t have permission to view it.
            </p>
          )}

          {isError && !notFound && (
            <p className="text-sm text-destructive">
              Couldn&apos;t load this activity entry. Try again.
            </p>
          )}

          {data && !isLoading && (
            <>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-medium">
                    {actionLabel(data.action)}
                  </Badge>
                  <Badge variant="outline">
                    {resourceTypeLabel(data.resource_type)}
                  </Badge>
                  {authLabel && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Via {authLabel}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium">{eventSummary(data)}</p>
                <p className="text-xs text-muted-foreground">
                  By {formatActor(data)} · {formatTimestamp(data.created_at)}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-border/60 p-2.5">
                  <dt className="text-muted-foreground">Resource id</dt>
                  <dd className="mt-0.5 font-mono tabular-nums">
                    {data.resource_id ?? "—"}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/60 p-2.5">
                  <dt className="text-muted-foreground">Public key</dt>
                  <dd className="mt-0.5 font-mono truncate" title={data.resource_key ?? undefined}>
                    {data.resource_key ?? "—"}
                  </dd>
                </div>
                {data.ip_address && (
                  <div className="rounded-lg border border-border/60 p-2.5 col-span-2">
                    <dt className="text-muted-foreground">IP address</dt>
                    <dd className="mt-0.5 font-mono">{data.ip_address}</dd>
                  </div>
                )}
              </dl>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Changes
                </h3>
                <AuditDiff rows={diffs} />
              </div>

              {data.metadata && Object.keys(data.metadata).length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Metadata
                  </h3>
                  <pre className="rounded-lg border border-border/60 bg-muted/20 p-3 text-[11px] leading-relaxed overflow-auto">
                    {JSON.stringify(data.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {data.user_agent && (
                <p className="text-[11px] text-muted-foreground break-all">
                  {data.user_agent}
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
