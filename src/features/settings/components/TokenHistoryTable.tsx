"use client";

import { useState, useMemo } from "react";
import { ChevronDown, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTokenHistory } from "../hooks/useSettings";
import type { TokenHistoryRecord } from "../types/billing.types";

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(amount: string, currency: string) {
  return `${parseFloat(amount).toLocaleString()} ${currency}`;
}

function humanize(t: string | null | undefined) {
  if (!t) return "—";
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const humanizeServiceType = humanize;
const humanizeStatus = humanize;

const SUCCESS_STATUSES = new Set(["completed", "success", "admin_adjustment", "paid"]);
const FAILED_STATUSES = new Set(["failed", "cancelled", "rejected", "expired"]);

function statusStyle(s: string) {
  if (SUCCESS_STATUSES.has(s))
    return "border-green-500/30 text-green-500 bg-green-500/10";
  if (FAILED_STATUSES.has(s))
    return "border-red-500/30 text-red-500 bg-red-500/10";
  return "border-yellow-500/30 text-yellow-500 bg-yellow-500/10";
}

type DateFilter = "all" | "today" | "week" | "month";
const DATE_LABELS: Record<DateFilter, string> = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
};

function matchesDate(str: string, f: DateFilter) {
  if (f === "all") return true;
  const d = new Date(str);
  const now = new Date();
  if (f === "today") return d.toDateString() === now.toDateString();
  const days = f === "week" ? 7 : 30;
  return d >= new Date(now.getTime() - days * 864e5);
}

export function TokenHistoryTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const { data, isLoading } = useTokenHistory(page);
  const records = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;
  const total = data?.total ?? 0;

  const serviceTypes = useMemo(() => {
    const seen = new Set<string>();
    records.forEach((r) => { if (r.service_type) seen.add(r.service_type); });
    return Array.from(seen);
  }, [records]);

  const statuses = useMemo(() => {
    const seen = new Set<string>();
    records.forEach((r) => seen.add(r.payment_status));
    return Array.from(seen);
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r: TokenHistoryRecord) => {
      if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
      if (serviceFilter !== "all" && r.service_type !== serviceFilter) return false;
      return matchesDate(r.created_at, dateFilter);
    });
  }, [records, statusFilter, serviceFilter, dateFilter]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-sm h-9">
              {statusFilter === "all" ? "All statuses" : humanizeStatus(statusFilter)}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-muted" : ""}
            >
              All statuses
            </DropdownMenuItem>
            {statuses.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setStatusFilter(s)}
                className={statusFilter === s ? "bg-muted" : ""}
              >
                {humanizeStatus(s)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Service type filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-sm h-9">
              {serviceFilter === "all" ? "All services" : humanizeServiceType(serviceFilter)}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => setServiceFilter("all")}
              className={serviceFilter === "all" ? "bg-muted" : ""}
            >
              All services
            </DropdownMenuItem>
            {serviceTypes.map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => setServiceFilter(t)}
                className={serviceFilter === t ? "bg-muted" : ""}
              >
                {humanizeServiceType(t)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-sm h-9">
              <CalendarDays className="h-3.5 w-3.5" />
              {DATE_LABELS[dateFilter]}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.entries(DATE_LABELS) as [DateFilter, string][]).map(([v, l]) => (
              <DropdownMenuItem
                key={v}
                onClick={() => setDateFilter(v)}
                className={dateFilter === v ? "bg-muted" : ""}
              >
                {l}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-medium">ID</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium hidden sm:table-cell">Service</TableHead>
              <TableHead className="text-xs font-medium">Tokens</TableHead>
              <TableHead className="text-xs font-medium hidden md:table-cell">Amount</TableHead>
              <TableHead className="text-xs font-medium hidden md:table-cell">Ref</TableHead>
              <TableHead className="text-xs font-medium hidden lg:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{r.id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusStyle(r.payment_status)}`}
                    >
                      {humanizeStatus(r.payment_status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {humanizeServiceType(r.service_type)}
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">
                    +{r.tokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell tabular-nums">
                    {formatAmount(r.amount, r.currency)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className="font-mono text-xs text-muted-foreground truncate max-w-[140px] block"
                      title={r.tx_ref}
                    >
                      {r.tx_ref}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {formatDate(r.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between px-1 py-2 border-t">
          <p className="text-xs text-muted-foreground">{total} total records</p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs px-2">
              {page} / {lastPage}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= lastPage}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
