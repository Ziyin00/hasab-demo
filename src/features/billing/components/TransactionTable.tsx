"use client";

import { useState, useMemo } from "react";
import { CalendarDays, ChevronDown, Receipt } from "lucide-react";
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
import { TablePagination } from "@/features/history/components/TablePagination";
import { useBillingHistory } from "../hooks/useBillingHistory";
import type { TokenTransaction } from "../types/billing.types";

type StatusFilter = "all" | "success" | "pending" | "failed";
type DateFilter = "all" | "today" | "week" | "month";

const STATUS_BUTTONS: { label: string; value: StatusFilter }[] = [
  { label: "View all", value: "all" },
  { label: "Successful", value: "success" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

const DATE_LABELS: Record<DateFilter, string> = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
};

const statusStyles: Record<string, string> = {
  success: "border-green-500/30 text-green-500 bg-green-500/10 dark:text-green-400",
  completed: "border-green-500/30 text-green-500 bg-green-500/10 dark:text-green-400",
  admin_adjustment: "border-blue-500/30 text-blue-500 bg-blue-500/10 dark:text-blue-400",
  pending: "border-yellow-500/30 text-yellow-500 bg-yellow-500/10 dark:text-yellow-400",
  failed: "border-red-500/30 text-red-500 bg-red-500/10 dark:text-red-400",
};

function getStatusGroup(status: string): StatusFilter {
  const s = status.toLowerCase();
  if (s === "success" || s === "completed" || s === "admin_adjustment") return "success";
  if (s === "pending") return "pending";
  if (s === "failed") return "failed";
  return "all";
}

function formatStatusLabel(status: string) {
  if (status.toLowerCase() === "admin_adjustment") return "Admin Topup";
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function matchesDate(dateStr: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (filter === "today") return d.toDateString() === now.toDateString();
  const days = filter === "week" ? 7 : 30;
  return d >= new Date(now.getTime() - days * 864e5);
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatId(id: number) {
  return `TX-${id.toString(16).padStart(8, "0")}`;
}

export function TransactionTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const { data, isLoading } = useBillingHistory(page);

  const records: TokenTransaction[] = data?.data ?? [];

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "all" && getStatusGroup(r.payment_status) !== statusFilter) return false;
      return matchesDate(r.created_at, dateFilter);
    });
  }, [records, statusFilter, dateFilter]);

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
              <TableHead className="text-xs font-medium text-right">Amount</TableHead>
              <TableHead className="text-xs font-medium text-right">Tokens</TableHead>
              <TableHead className="text-xs font-medium hidden sm:table-cell">Transaction Ref</TableHead>
              <TableHead className="text-xs font-medium hidden md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatId(r.id)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        statusStyles[r.payment_status?.toLowerCase()] ?? statusStyles.pending
                      }`}
                    >
                      {formatStatusLabel(r.payment_status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {parseFloat(r.amount).toFixed(2)} {r.currency}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {r.tokens?.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="font-mono text-xs text-muted-foreground truncate max-w-[180px] block">
                      {r.tx_ref}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {formatDate(r.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <TablePagination page={page} lastPage={lastPage} total={total} onPage={setPage} />
      )}
    </div>
  );
}
