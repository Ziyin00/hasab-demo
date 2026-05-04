"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Loader2, ChevronDown, CalendarDays } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranscriptionHistory } from "../hooks/useTranscriptionHistory";
import { historyApi } from "../api/history.api";
import { TablePagination } from "./TablePagination";
import type { TranscriptionRecord } from "../types/history.types";

function formatDuration(seconds: string) {
  const s = parseFloat(seconds);
  if (!s || isNaN(s)) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatId(id: number) {
  return `T-${id.toString(16).padStart(8, "0")}`;
}

function getTransactionType(r: TranscriptionRecord) {
  if (r.is_meeting) return "Meeting";
  if (r.audio_type === "realtime" || r.audio_type === "real-time") return "Real-time";
  return "Asynchronous";
}

const statusStyles: Record<string, string> = {
  completed:
    "border-green-500/30 text-green-500 bg-green-500/10 dark:text-green-400",
  processing:
    "border-blue-500/30 text-blue-500 bg-blue-500/10 dark:text-blue-400",
  failed:
    "border-red-500/30 text-red-500 bg-red-500/10 dark:text-red-400",
  pending:
    "border-yellow-500/30 text-yellow-500 bg-yellow-500/10 dark:text-yellow-400",
};

const statusLabels: Record<string, string> = {
  completed: "Completed",
  processing: "In Progress",
  failed: "Error",
  pending: "Pending",
};

type StatusFilter = "all" | "completed" | "processing" | "failed";
type TypeFilter = "all" | "meeting" | "asynchronous" | "realtime";
type DateFilter = "all" | "today" | "week" | "month";

const DATE_LABELS: Record<DateFilter, string> = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
};

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All transcriptions",
  meeting: "Meetings",
  asynchronous: "Asynchronous",
  realtime: "Real-time",
};

const STATUS_BUTTONS: { label: string; value: StatusFilter }[] = [
  { label: "View all", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "In progress", value: "processing" },
  { label: "Error", value: "failed" },
];

function matchesDate(dateStr: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (filter === "today") return d.toDateString() === now.toDateString();
  const days = filter === "week" ? 7 : 30;
  return d >= new Date(now.getTime() - days * 864e5);
}

export function TranscriptionTable() {
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const { data, isLoading } = useTranscriptionHistory(page);
  const router = useRouter();
  const queryClient = useQueryClient();

  const allRecords = data?.data ?? [];

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (statusFilter !== "all") {
        const groups: Record<StatusFilter, string[]> = {
          all: [],
          completed: ["completed"],
          processing: ["processing", "pending"],
          failed: ["failed"],
        };
        if (!groups[statusFilter].includes(r.processing_status)) return false;
      }
      if (typeFilter !== "all") {
        const t = getTransactionType(r).toLowerCase();
        if (typeFilter === "meeting" && t !== "meeting") return false;
        if (typeFilter === "asynchronous" && t !== "asynchronous") return false;
        if (typeFilter === "realtime" && t !== "real-time") return false;
      }
      return matchesDate(r.created_at, dateFilter);
    });
  }, [allRecords, statusFilter, typeFilter, dateFilter]);

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(id);
    try {
      await historyApi.deleteTranscription(id);
      toast.success("Deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["history", "transcription"] });
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  const lastPage = data?.last_page ?? 1;
  const total = data?.total ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-1">
          {STATUS_BUTTONS.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                statusFilter === btn.value
                  ? "bg-background shadow-sm font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-sm h-9">
              {TYPE_LABELS[typeFilter]}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.entries(TYPE_LABELS) as [TypeFilter, string][]).map(([value, label]) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setTypeFilter(value)}
                className={typeFilter === value ? "bg-muted" : ""}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-sm h-9">
              <CalendarDays className="h-3.5 w-3.5" />
              {DATE_LABELS[dateFilter]}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.entries(DATE_LABELS) as [DateFilter, string][]).map(([value, label]) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setDateFilter(value)}
                className={dateFilter === value ? "bg-muted" : ""}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-medium">ID</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium hidden sm:table-cell">
                Transaction type
              </TableHead>
              <TableHead className="text-xs font-medium">File name</TableHead>
              <TableHead className="text-xs font-medium hidden md:table-cell">Duration</TableHead>
              <TableHead className="text-xs font-medium hidden md:table-cell">Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  No transcriptions found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/history/transcription/${r.id}`)
                  }
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatId(r.id)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        statusStyles[r.processing_status] ?? statusStyles.pending
                      }`}
                    >
                      {statusLabels[r.processing_status] ?? r.processing_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {getTransactionType(r)}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-sm">
                      {r.original_filename || r.filename}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {formatDuration(r.duration_in_seconds)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {formatDate(r.created_at)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          {deleting === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => handleDelete(r.id, e)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <TablePagination
          page={page}
          lastPage={lastPage}
          total={total}
          onPage={setPage}
        />
      )}
    </div>
  );
}
