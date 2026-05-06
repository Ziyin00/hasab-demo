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

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function TranscriptionTable({ records, isLoading }: { records: TranscriptionRecord[]; isLoading: boolean }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Recent Transcriptions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest 5 audio jobs</p>
        </div>
        <Link
          href="/dashboard/history"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="text-xs font-medium">File</TableHead>
            <TableHead className="text-xs font-medium">Status</TableHead>
            <TableHead className="text-xs font-medium">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-sm">
                No transcriptions yet
              </TableCell>
            </TableRow>
          ) : (
            records.map((r) => (
              <TableRow
                key={r.id}
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => window.location.assign(`/dashboard/playground/transcription/${r.id}`)}
              >
                <TableCell className="text-sm font-medium max-w-[160px]">
                  <span className="truncate block">{r.original_filename ?? r.filename}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0.5 rounded-full ${statusStyle(r.processing_status)}`}
                  >
                    {humanize(r.processing_status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(r.created_at)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TranslationTable({ records, isLoading }: { records: TranslationRecord[]; isLoading: boolean }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Recent Translations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest 5 translation jobs</p>
        </div>
        <Link
          href="/dashboard/history"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="text-xs font-medium">Languages</TableHead>
            <TableHead className="text-xs font-medium">Status</TableHead>
            <TableHead className="text-xs font-medium">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-sm">
                No translations yet
              </TableCell>
            </TableRow>
          ) : (
            records.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/30">
                <TableCell className="text-sm font-medium">
                  {r.source_language} → {r.target_language}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0.5 rounded-full ${statusStyle(r.success ? "success" : "failed")}`}
                  >
                    {r.success ? "Success" : "Failed"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(r.created_at)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function RecentActivity() {
  const { data: txData, isLoading: txLoading } = useTranscriptionHistory(1);
  const { data: tlData, isLoading: tlLoading } = useTranslationHistory(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TranscriptionTable
        records={txData?.data.slice(0, 5) ?? []}
        isLoading={txLoading}
      />
      <TranslationTable
        records={tlData?.data.slice(0, 5) ?? []}
        isLoading={tlLoading}
      />
    </div>
  );
}
