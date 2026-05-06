"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

type Row =
  | { kind: "transcription"; record: TranscriptionRecord }
  | { kind: "translation"; record: TranslationRecord };

function statusStyle(status: string) {
  if (["completed", "success"].includes(status))
    return "border-green-500/30 text-green-500 bg-green-500/10";
  if (["failed", "error"].includes(status))
    return "border-red-500/30 text-red-500 bg-red-500/10";
  return "border-yellow-500/30 text-yellow-500 bg-yellow-500/10";
}

function humanize(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentActivity() {
  const { data: txData, isLoading: txLoading } = useTranscriptionHistory(1);
  const { data: tlData, isLoading: tlLoading } = useTranslationHistory(1);

  const isLoading = txLoading || tlLoading;

  const rows: Row[] = [
    ...(txData?.data.slice(0, 5).map((r) => ({ kind: "transcription" as const, record: r })) ?? []),
    ...(tlData?.data.slice(0, 5).map((r) => ({ kind: "translation" as const, record: r })) ?? []),
  ].sort((a, b) => new Date(b.record.created_at).getTime() - new Date(a.record.created_at).getTime());

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Recent Activity</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Latest transcriptions and translations
          </p>
        </div>
        <Link
          href="/dashboard/history"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="text-xs font-medium">Type</TableHead>
            <TableHead className="text-xs font-medium">Name</TableHead>
            <TableHead className="text-xs font-medium hidden sm:table-cell">Status</TableHead>
            <TableHead className="text-xs font-medium hidden md:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                No recent activity
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => {
              if (row.kind === "transcription") {
                const r = row.record;
                return (
                  <TableRow
                    key={`tx-${r.id}-${i}`}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => window.location.assign(`/dashboard/playground/transcription/${r.id}`)}
                  >
                    <TableCell>
                      <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-500 bg-blue-500/10">
                        Transcription
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium max-w-[200px] truncate">
                      {r.original_filename ?? r.filename}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 rounded-full ${statusStyle(r.processing_status)}`}
                      >
                        {humanize(r.processing_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {formatDate(r.created_at)}
                    </TableCell>
                  </TableRow>
                );
              }

              const r = row.record;
              return (
                <TableRow key={`tl-${r.id}-${i}`} className="hover:bg-muted/30">
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-500 bg-violet-500/10">
                      Translation
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {r.source_language} → {r.target_language}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0.5 rounded-full ${statusStyle(r.success ? "success" : "failed")}`}
                    >
                      {r.success ? "Success" : "Failed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {formatDate(r.created_at)}
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
