"use client";

import { Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TopPage } from "../types/analytics.types";
import { EmptyState } from "./EmptyState";
import { toPercent } from "../utils/format";

interface TopPagesTableProps {
  data: TopPage[];
  loading?: boolean;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function path(url: string): string {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}` || "/";
  } catch {
    return url;
  }
}

export function TopPagesTable({ data, loading }: TopPagesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const pages = data.filter((d) => d.conversations_count > 0);
  if (!pages.length) {
    return <EmptyState icon={Globe} message="No widget page URLs recorded in this range." />;
  }

  const total = pages.reduce((sum, d) => sum + d.conversations_count, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-9 w-10 bg-muted/40 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            #
          </TableHead>
          <TableHead className="h-9 bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Page
          </TableHead>
          <TableHead className="h-9 hidden bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">
            Host
          </TableHead>
          <TableHead className="h-9 bg-muted/40 px-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Conversations
          </TableHead>
          <TableHead className="h-9 bg-muted/40 px-3 pr-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Share
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page, index) => {
          const share = total > 0 ? page.conversations_count / total : 0;
          return (
            <TableRow key={page.page_url}>
              <TableCell className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell className="max-w-xs px-3 py-3">
                <p className="truncate text-sm font-medium" title={page.page_url}>
                  {path(page.page_url)}
                </p>
              </TableCell>
              <TableCell className="hidden max-w-40 px-3 py-3 md:table-cell">
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {hostname(page.page_url)}
                </p>
              </TableCell>
              <TableCell className="px-3 py-3 text-right text-sm tabular-nums">
                {page.conversations_count.toLocaleString()}
              </TableCell>
              <TableCell className="px-3 pr-4 py-3 text-right">
                <div className="ml-auto flex max-w-28 flex-col items-end gap-1">
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {toPercent(share, 0)}
                  </span>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(share * 100, 4)}%` }}
                    />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
