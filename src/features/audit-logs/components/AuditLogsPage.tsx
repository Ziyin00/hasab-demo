"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  History,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Bot,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAccess } from "@/hooks/useAccess";
import { useAuditLogs } from "../hooks/useAuditLogs";
import type {
  AuditAction,
  AuditLogEntry,
  AuditLogQuery,
  AuditResourceType,
} from "../types/audit-log.types";
import {
  FILTER_ACTIONS,
  FILTER_RESOURCE_TYPES,
  actionLabel,
  eventSummary,
  formatActor,
  formatAuthMethod,
  formatTimestamp,
  resourceTypeLabel,
  timeAgo,
} from "../utils/format";
import { AuditLogDetailDrawer } from "./AuditLogDetailDrawer";

function ActionIcon({ action }: { action: string }) {
  if (action.endsWith(".created")) return <Plus className="h-3 w-3" />;
  if (action.endsWith(".deleted")) return <Trash2 className="h-3 w-3" />;
  return <Pencil className="h-3 w-3" />;
}

function iconTone(action: string): string {
  if (action.endsWith(".created")) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }
  if (action.endsWith(".deleted")) {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-primary/10 text-primary";
}

function ResourceBadge({ entry }: { entry: AuditLogEntry }) {
  const Icon = entry.resource_type === "chatbot_widget" ? Bot : FileText;
  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
    >
      <Icon className="h-2.5 w-2.5" />
      {resourceTypeLabel(entry.resource_type)}
    </Badge>
  );
}

export function AuditLogsPage() {
  const { isOrgAdmin } = useAccess();
  const [resourceType, setResourceType] = useState("all");
  const [action, setAction] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const query: AuditLogQuery = {
    page,
    per_page: 20,
    ...(resourceType !== "all"
      ? { resource_type: resourceType as AuditResourceType }
      : {}),
    ...(action !== "all" ? { action: action as AuditAction } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
  };

  const { data, isLoading, isError, refetch } = useAuditLogs(query);
  const logs = data?.audit_logs ?? [];
  const pagination = data?.pagination;

  const from =
    pagination && pagination.total > 0
      ? (pagination.current_page - 1) * pagination.per_page + 1
      : 0;
  const to = pagination
    ? Math.min(pagination.current_page * pagination.per_page, pagination.total)
    : 0;

  const openDetail = (id: number) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Activity</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isOrgAdmin
              ? "Who changed contexts and widgets across your organization."
              : "Your changes to contexts and widgets."}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-border/40 bg-linear-to-br from-primary/3 via-card to-card px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
              <Select
                value={resourceType}
                onValueChange={(v) => {
                  setResourceType(v);
                  resetPage();
                }}
              >
                <SelectTrigger className="h-8 w-full min-w-0 border-border/60 bg-background/80 text-sm sm:w-48">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_RESOURCE_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={action}
                onValueChange={(v) => {
                  setAction(v);
                  resetPage();
                }}
              >
                <SelectTrigger className="h-8 w-full min-w-0 border-border/60 bg-background/80 text-sm sm:w-52">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_ACTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(dateFrom || dateTo || resourceType !== "all" || action !== "all") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs col-span-2 sm:col-span-1"
                  onClick={() => {
                    setResourceType("all");
                    setAction("all");
                    setDateFrom("");
                    setDateTo("");
                    resetPage();
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 lg:ml-auto">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  resetPage();
                }}
                className="h-8 w-full border-border/60 bg-background/80 text-sm sm:w-32"
                aria-label="From date"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  resetPage();
                }}
                className="h-8 w-full border-border/60 bg-background/80 text-sm sm:w-32"
                aria-label="To date"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 bg-muted/40 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                Event
              </TableHead>
              <TableHead className="h-10 bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Resource
              </TableHead>
              <TableHead className="h-10 hidden bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">
                Actor
              </TableHead>
              <TableHead className="h-10 hidden bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">
                Via
              </TableHead>
              <TableHead className="h-10 bg-muted/40 px-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                When
              </TableHead>
              <TableHead className="h-10 w-8 bg-muted/40 pr-3 sm:pr-4" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell className="px-4 py-3.5 sm:px-5">
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-56 max-w-full" />
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="hidden px-3 py-3.5 md:table-cell">
                    <Skeleton className="h-3.5 w-28" />
                  </TableCell>
                  <TableCell className="hidden px-3 py-3.5 lg:table-cell">
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="px-3 py-3.5 text-right sm:px-5">
                    <Skeleton className="ml-auto h-3 w-12" />
                  </TableCell>
                  <TableCell className="pr-3 sm:pr-4" />
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-14 text-center sm:px-5">
                  <p className="text-sm text-destructive">Couldn&apos;t load activity.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && logs.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-14 text-center sm:px-5">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <History className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">No changes recorded yet.</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Creates, updates, and deletes for contexts and widgets will show up here.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              logs.map((entry) => {
                const authLabel = formatAuthMethod(entry.auth_method);
                return (
                  <TableRow
                    key={entry.id}
                    className="group cursor-pointer"
                    onClick={() => openDetail(entry.id)}
                  >
                    <TableCell className="px-4 py-3.5 sm:px-5">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                            iconTone(entry.action)
                          )}
                        >
                          <ActionIcon action={entry.action} />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate text-sm font-medium text-foreground">
                            {actionLabel(entry.action)}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {eventSummary(entry)}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground md:hidden">
                            {formatActor(entry)}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-3 py-3.5">
                      <div className="min-w-0 space-y-1">
                        <ResourceBadge entry={entry} />
                        {(entry.resource_key || entry.resource_id != null) && (
                          <p className="truncate font-mono text-[10px] text-muted-foreground">
                            {entry.resource_key ?? `#${entry.resource_id}`}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="hidden max-w-45 px-3 py-3.5 md:table-cell">
                      <p className="truncate text-sm text-foreground/90">
                        {formatActor(entry)}
                      </p>
                      {entry.user?.email && entry.user?.name && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {entry.user.email}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="hidden px-3 py-3.5 lg:table-cell">
                      {authLabel ? (
                        <Badge
                          variant="secondary"
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        >
                          {authLabel}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    <TableCell className="px-3 py-3.5 text-right sm:px-5">
                      <span
                        className="text-[11px] tabular-nums text-muted-foreground"
                        title={formatTimestamp(entry.created_at)}
                      >
                        {timeAgo(entry.created_at)}
                      </span>
                    </TableCell>

                    <TableCell className="pr-3 sm:pr-4">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-border/40 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {from.toLocaleString()}–{to.toLocaleString()}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {pagination.total.toLocaleString()}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 border-border/60 p-0"
                  disabled={pagination.current_page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 border-border/60 p-0"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuditLogDetailDrawer
        id={detailId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailId(null);
        }}
      />
    </div>
  );
}
