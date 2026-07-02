"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConversations } from "../hooks/useConversations";
import type { AnalyticsRange, Conversation } from "../types/analytics.types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const SOURCE_BADGE: Record<string, string> = {
  widget: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  web: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  mobile: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

interface ConversationInboxProps {
  range: AnalyticsRange;
}

export function ConversationInbox({ range }: ConversationInboxProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [source, setSource] = useState("all");
  const [satisfaction, setSatisfaction] = useState("all");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => { setPage(1); }, [source, satisfaction, range]);

  const { data, isLoading } = useConversations({
    range,
    page,
    per_page: 10,
    search: debouncedSearch || undefined,
    source: source !== "all" ? source : undefined,
    satisfaction_rating: satisfaction !== "all" ? satisfaction : undefined,
  });

  const conversations = data?.conversations ?? [];
  const pagination = data?.pagination;

  return (
    <div className="rounded-xl border bg-card">
      {/* Header + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b">
        <h2 className="text-sm font-semibold">Conversation Inbox</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-full sm:w-48 text-sm"
            />
          </div>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-8 w-full sm:w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="widget">Widget</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
          <Select value={satisfaction} onValueChange={setSatisfaction}>
            <SelectTrigger className="h-8 w-full sm:w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-3.5 w-12 shrink-0" />
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No conversations found.
          </div>
        ) : (
          conversations.map((c: Conversation) => (
            <button
              key={c.id}
              className="w-full text-left px-5 py-3.5 hover:bg-muted/40 transition-colors"
              onClick={() => router.push(`/dashboard/analytics/conversations/${c.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate max-w-[240px]">
                      {c.title || "Untitled conversation"}
                    </span>
                    {c.source && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase shrink-0",
                          SOURCE_BADGE[c.source] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {c.source}
                      </span>
                    )}
                  </div>
                  {c.last_message_preview && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {c.last_message_preview}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {timeAgo(c.created_at)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {c.message_count}
                    </span>
                    {c.satisfaction_rating === "positive" && (
                      <ThumbsUp className="h-3 w-3 text-green-600" />
                    )}
                    {c.satisfaction_rating === "negative" && (
                      <ThumbsDown className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t">
          <span className="text-xs text-muted-foreground">
            Page {pagination.current_page} of {pagination.last_page} · {pagination.total.toLocaleString()} total
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={pagination.current_page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
