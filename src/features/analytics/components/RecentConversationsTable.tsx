"use client";

import { useRouter } from "next/navigation";
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
import type { Conversation } from "../types/analytics.types";
import { formatLanguageLabel, timeAgo } from "../utils/format";
import { EmptyState } from "./EmptyState";
import { Inbox } from "lucide-react";

interface RecentConversationsTableProps {
  conversations: Conversation[];
  loading?: boolean;
}

export function RecentConversationsTable({
  conversations,
  loading,
}: RecentConversationsTableProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    return <EmptyState icon={Inbox} message="No conversations in this range." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-9 bg-muted/40 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            First message
          </TableHead>
          <TableHead className="h-9 bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Category
          </TableHead>
          <TableHead className="h-9 hidden bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
            Language
          </TableHead>
          <TableHead className="h-9 bg-muted/40 px-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Msgs
          </TableHead>
          <TableHead className="h-9 bg-muted/40 px-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Started
          </TableHead>
          <TableHead className="h-9 w-8 bg-muted/40 pr-3" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {conversations.map((c) => {
          const categorized = c.category && c.category.id != null;
          return (
            <TableRow
              key={c.id}
              className="group cursor-pointer"
              onClick={() => router.push(`/dashboard/analytics/conversations/${c.id}`)}
            >
              <TableCell className="max-w-xs px-4 py-3">
                <p className="truncate text-sm font-medium">{c.title || "Untitled"}</p>
              </TableCell>
              <TableCell className="px-3 py-3">
                {categorized ? (
                  <Badge
                    variant="outline"
                    className="rounded-md border-primary/20 bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                  >
                    {c.category!.name}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-md border-dashed px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    Uncategorized
                  </Badge>
                )}
              </TableCell>
              <TableCell className="hidden px-3 py-3 text-xs text-muted-foreground sm:table-cell">
                {c.language ? formatLanguageLabel(c.language) : "—"}
              </TableCell>
              <TableCell className="px-3 py-3 text-center text-xs tabular-nums text-muted-foreground">
                {c.message_count}
              </TableCell>
              <TableCell className="px-3 py-3 text-right text-[11px] tabular-nums text-muted-foreground">
                {timeAgo(c.created_at)}
              </TableCell>
              <TableCell className="pr-3">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
