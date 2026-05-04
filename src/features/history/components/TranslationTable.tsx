"use client";

import { useState, useMemo } from "react";
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
import { useTranslationHistory } from "../hooks/useTranslationHistory";
import { historyApi } from "../api/history.api";
import { TablePagination } from "./TablePagination";
import { TranslationDrawer } from "./TranslationDrawer";
import type { TranslationRecord } from "../types/history.types";

const LANG_NAMES: Record<string, string> = {
  amh: "Amharic",
  orm: "Oromo",
  eng: "English",
  fra: "French",
  ara: "Arabic",
  som: "Somali",
};

function langLabel(code: string) {
  return LANG_NAMES[code] ?? code.toUpperCase();
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
  return `R-${id.toString(16).padStart(8, "0")}`;
}

type StatusFilter = "all" | "success" | "failed";
type DateFilter = "all" | "today" | "week" | "month";

const DATE_LABELS: Record<DateFilter, string> = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
};

const STATUS_BUTTONS: { label: string; value: StatusFilter }[] = [
  { label: "View all", value: "all" },
  { label: "Completed", value: "success" },
  { label: "Failed", value: "failed" },
];

const statusStyles: Record<string, string> = {
  success: "border-green-500/30 text-green-500 bg-green-500/10 dark:text-green-400",
  failed: "border-red-500/30 text-red-500 bg-red-500/10 dark:text-red-400",
};

function matchesDate(dateStr: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (filter === "today") return d.toDateString() === now.toDateString();
  const days = filter === "week" ? 7 : 30;
  return d >= new Date(now.getTime() - days * 864e5);
}

export function TranslationTable() {
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [langFilter, setLangFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TranslationRecord | null>(null);
  const { data, isLoading } = useTranslationHistory(page);
  const queryClient = useQueryClient();

  const allRecords = data?.data ?? [];

  const langPairs = useMemo(() => {
    const seen = new Set<string>();
    allRecords.forEach((r) => seen.add(`${r.source_language}-${r.target_language}`));
    return Array.from(seen);
  }, [allRecords]);

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (statusFilter === "success" && !r.success) return false;
      if (statusFilter === "failed" && r.success) return false;
      if (langFilter !== "all" && `${r.source_language}-${r.target_language}` !== langFilter)
        return false;
      return matchesDate(r.created_at, dateFilter);
    });
  }, [allRecords, statusFilter, langFilter, dateFilter]);

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(id);
    try {
      await historyApi.deleteTranslation(id);
      toast.success("Deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["history", "translation"] });
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  const lastPage = data?.last_page ?? 1;
  const total = data?.total ?? 0;

  const langFilterLabel =
    langFilter === "all"
      ? "All languages"
      : `${langLabel(langFilter.split("-")[0])} → ${langLabel(langFilter.split("-")[1])}`;

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
    <>
      <TranslationDrawer
        record={selectedRecord}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

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
                {langFilterLabel}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => setLangFilter("all")}
                className={langFilter === "all" ? "bg-muted" : ""}
              >
                All languages
              </DropdownMenuItem>
              {langPairs.map((pair) => {
                const [src, tgt] = pair.split("-");
                return (
                  <DropdownMenuItem
                    key={pair}
                    onClick={() => setLangFilter(pair)}
                    className={langFilter === pair ? "bg-muted" : ""}
                  >
                    {langLabel(src)} → {langLabel(tgt)}
                  </DropdownMenuItem>
                );
              })}
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
                <TableHead className="text-xs font-medium hidden sm:table-cell">From</TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">To</TableHead>
                <TableHead className="text-xs font-medium">Source text</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">
                  Characters
                </TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No translations found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => {
                      setSelectedRecord(r);
                      setDrawerOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatId(r.id)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          r.success ? statusStyles.success : statusStyles.failed
                        }`}
                      >
                        {r.success ? "Completed" : "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {langLabel(r.source_language)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {langLabel(r.target_language)}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate text-sm">{r.source_text}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {r.character_count.toLocaleString()}
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
    </>
  );
}
