"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, FileText, Languages, MoreHorizontal, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranscriptionHistory } from "@/features/history/hooks/useTranscriptionHistory";
import { useTranslationHistory } from "@/features/history/hooks/useTranslationHistory";
import type { TranscriptionRecord, TranslationRecord } from "@/features/history/types/history.types";
import { cn } from "@/lib/utils";

/* ─── helpers ─── */
function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    completed: { label: "Success", className: "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
    success: { label: "Success", className: "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
    processing: { label: "Processing", className: "border-amber-500/30 text-amber-600 bg-amber-500/10 dark:text-amber-400" },
    pending: { label: "Queued", className: "border-amber-500/30 text-amber-600 bg-amber-500/10 dark:text-amber-400" },
    failed: { label: "Failed", className: "border-red-500/30 text-red-600 bg-red-500/10 dark:text-red-400" },
    error: { label: "Failed", className: "border-red-500/30 text-red-600 bg-red-500/10 dark:text-red-400" },
  };
  const found = map[status] ?? { label: status, className: "border-border text-muted-foreground bg-muted" };
  return found;
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

interface UnifiedRow {
  id: string;
  name: string;
  type: "transcription" | "translation";
  date: string;
  status: string;
  duration: string;
  href?: string;
}

function mergeAndSort(
  txRecords: TranscriptionRecord[],
  tlRecords: TranslationRecord[],
): UnifiedRow[] {
  const rows: UnifiedRow[] = [];

  for (const r of txRecords) {
    rows.push({
      id: `tx-${r.id}`,
      name: r.original_filename ?? r.filename ?? "Transcription",
      type: "transcription",
      date: r.created_at,
      status: r.processing_status,
      duration: timeAgo(r.created_at),
      href: `/dashboard/playground/transcription/${r.id}`,
    });
  }

  for (const r of tlRecords) {
    rows.push({
      id: `tl-${r.id}`,
      name: `${r.source_language} → ${r.target_language}`,
      type: "translation",
      date: r.created_at,
      status: r.success ? "success" : "failed",
      duration: timeAgo(r.created_at),
    });
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return rows.slice(0, 5);
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function RecentActivity() {
  const { data: txData, isLoading: txLoading } = useTranscriptionHistory(1);
  const { data: tlData, isLoading: tlLoading } = useTranslationHistory(1);

  const isLoading = txLoading || tlLoading;

  const rows = useMemo(
    () => mergeAndSort(txData?.data.slice(0, 5) ?? [], tlData?.data.slice(0, 5) ?? []),
    [txData, tlData],
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
            <FileText className="size-3.5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold">Recent Workflows</h3>
        </div>
        <Link
          href="/dashboard/history"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          View all <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs font-medium">Name</TableHead>
            <TableHead className="text-xs font-medium">Date</TableHead>
            <TableHead className="text-xs font-medium">Status</TableHead>
            <TableHead className="text-xs font-medium">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                No recent activity yet. Start by using one of the playground services.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const { label, className } = statusBadge(row.status);
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-muted/30",
                    row.href && "cursor-pointer",
                  )}
                  onClick={() => row.href && window.location.assign(row.href)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        row.type === "transcription" ? "bg-blue-500/10" : "bg-violet-500/10",
                      )}>
                        {row.type === "transcription" ? (
                          <Mic className="size-3.5 text-blue-500" />
                        ) : (
                          <Languages className="size-3.5 text-violet-500" />
                        )}
                      </div>
                      <span className="max-w-[160px] truncate text-sm font-medium sm:max-w-[220px]">
                        {row.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(row.date)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("rounded-full px-2 py-0.5 text-[11px]", className)}
                    >
                      {label}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {row.duration}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
