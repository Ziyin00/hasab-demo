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
  ArrowRight,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Tag,
  Bot,
  LayoutDashboard,
  Inbox,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useConversations } from "../hooks/useConversations";
import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import { useCategories } from "@/features/chatbot-widgets/hooks/useCategories";
import type { AnalyticsRange, Conversation } from "../types/analytics.types";
import { formatLanguageLabel, formatSourceLabel } from "../utils/format";
import { EmptyState } from "./EmptyState";

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

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

const SOURCE_STYLE: Record<string, string> = {
  widget:
    "border-primary/25 bg-primary/8 text-primary",
  web: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  mobile: "border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-400",
  dashboard:
    "border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
};

const SOURCE_ICON: Record<string, typeof Bot> = {
  widget: Bot,
  web: Globe,
  mobile: Smartphone,
  dashboard: LayoutDashboard,
};

const DEVICE_ICON: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function SourceBadge({ source }: { source: string | null }) {
  if (!source) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const Icon = SOURCE_ICON[source] ?? Globe;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize",
        SOURCE_STYLE[source] ?? "border-border bg-muted/50 text-muted-foreground"
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {formatSourceLabel(source)}
    </Badge>
  );
}

function CategoryCell({ conversation }: { conversation: Conversation }) {
  const category = conversation.category;
  if (!category || category.id === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/80 bg-muted/30 px-1.5 py-0.5 text-[11px] text-muted-foreground">
        <Tag className="h-2.5 w-2.5" />
        Uncategorized
      </span>
    );
  }
  return (
    <div className="min-w-0">
      <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
        <Tag className="h-2.5 w-2.5 shrink-0" />
        <span className="truncate">{category.name}</span>
      </span>
      {conversation.category_source && (
        <p className="mt-0.5 pl-0.5 text-[10px] capitalize text-muted-foreground/80">
          {conversation.category_source}
        </p>
      )}
    </div>
  );
}

function OriginCell({ conversation }: { conversation: Conversation }) {
  const widget = conversation.chatbot_widget;
  const isWidget = conversation.source === "widget" || !!widget;

  if (isWidget && widget) {
    return (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{widget.name}</p>
        <p className="truncate font-mono text-[10px] text-muted-foreground">
          {widget.widget_id}
        </p>
      </div>
    );
  }

  if (isWidget) {
    return (
      <span className="text-sm text-muted-foreground">Widget</span>
    );
  }

  const host = conversation.page_url ? safeHostname(conversation.page_url) : null;
  const label =
    conversation.source === "dashboard"
      ? "Dashboard"
      : conversation.source === "mobile"
        ? "Mobile app"
        : host ?? "Platform";

  return (
    <div className="min-w-0">
      <p className="truncate text-sm text-foreground/90">{label}</p>
      {host && conversation.source !== "dashboard" && label !== host && (
        <p className="truncate text-[10px] text-muted-foreground">{host}</p>
      )}
    </div>
  );
}

interface ConversationInboxProps {
  range: AnalyticsRange;
}

export function ConversationInbox({ range }: ConversationInboxProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [source, setSource] = useState("all");
  const [satisfaction, setSatisfaction] = useState("all");
  const [widgetId, setWidgetId] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: widgets } = useChatbotWidgets();
  const selectedWidgetId = widgetId !== "all" ? Number(widgetId) : 0;
  const { data: widgetCategories } = useCategories(selectedWidgetId);

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

  // Reset to page 1 whenever the date range changes from the parent.
  const [prevRange, setPrevRange] = useState(range);
  if (prevRange !== range) {
    setPrevRange(range);
    setPage(1);
  }

  const setSourceFilter = (v: string) => {
    setSource(v);
    setPage(1);
  };
  const setSatisfactionFilter = (v: string) => {
    setSatisfaction(v);
    setPage(1);
  };
  const setCategoryFilterValue = (v: string) => {
    setCategoryFilter(v);
    setPage(1);
  };
  const handleWidgetChange = (v: string) => {
    setWidgetId(v);
    setCategoryFilter("all");
    setPage(1);
  };

  const { data, isLoading } = useConversations({
    range,
    page,
    per_page: 12,
    search: debouncedSearch || undefined,
    source: source !== "all" ? source : undefined,
    satisfaction_rating: satisfaction !== "all" ? satisfaction : undefined,
    chatbot_widget_id: widgetId !== "all" ? Number(widgetId) : undefined,
    ...(categoryFilter === "uncategorized"
      ? { category: "uncategorized" as const }
      : categoryFilter !== "all"
        ? { category_id: Number(categoryFilter) }
        : {}),
  });

  const conversations = data?.conversations ?? [];
  const pagination = data?.pagination;
  const from =
    pagination && pagination.total > 0
      ? (pagination.current_page - 1) * pagination.per_page + 1
      : 0;
  const to = pagination
    ? Math.min(pagination.current_page * pagination.per_page, pagination.total)
    : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      {/* Toolbar — one row on desktop, stacked/grid on mobile */}
      <div className="border-b border-border/40 bg-linear-to-br from-primary/3 via-card to-card px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
          

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-2">
            <div className="relative col-span-2 min-w-0 sm:col-span-3 lg:min-w-40 lg:flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 border-border/60 bg-background/80 pl-8 text-sm"
              />
            </div>

            <Select value={source} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 w-full min-w-0 border-border/60 bg-background/80 text-sm lg:w-28">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="widget">Widget</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="dashboard">Dashboard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={satisfaction} onValueChange={setSatisfactionFilter}>
              <SelectTrigger className="h-8 w-full min-w-0 border-border/60 bg-background/80 text-sm lg:w-28">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={widgetId} onValueChange={handleWidgetChange}>
              <SelectTrigger className="h-8 w-full min-w-0 border-border/60 bg-background/80 text-sm lg:w-32">
                <SelectValue placeholder="Widget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All widgets</SelectItem>
                {(widgets ?? []).map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilterValue}
              disabled={widgetId === "all"}
            >
              <SelectTrigger className="h-8 w-full min-w-0 border-border/60 bg-background/80 text-sm lg:w-32">
                <SelectValue
                  placeholder={widgetId === "all" ? "Pick a widget…" : "Category"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {(widgetCategories ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 bg-muted/40 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
              Conversation
            </TableHead>
            <TableHead className="h-10 bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Source
            </TableHead>
            <TableHead className="h-10 hidden bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">
              From
            </TableHead>
            <TableHead className="h-10 bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Category
            </TableHead>
            <TableHead className="h-10 hidden bg-muted/40 px-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
              Msgs
            </TableHead>
            <TableHead className="h-10 hidden bg-muted/40 px-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">
              Rating
            </TableHead>
            <TableHead className="h-10 bg-muted/40 px-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
              When
            </TableHead>
            <TableHead className="h-10 w-8 bg-muted/40 pr-3 sm:pr-4" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell className="px-4 py-3.5 sm:px-5">
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-44" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </div>
                </TableCell>
                <TableCell className="px-3 py-3.5">
                  <Skeleton className="h-5 w-16 rounded-md" />
                </TableCell>
                <TableCell className="hidden px-3 py-3.5 md:table-cell">
                  <Skeleton className="h-3.5 w-28" />
                </TableCell>
                <TableCell className="px-3 py-3.5">
                  <Skeleton className="h-5 w-20 rounded-md" />
                </TableCell>
                <TableCell className="hidden px-3 py-3.5 sm:table-cell">
                  <Skeleton className="mx-auto h-3.5 w-8" />
                </TableCell>
                <TableCell className="hidden px-3 py-3.5 lg:table-cell">
                  <Skeleton className="mx-auto h-3.5 w-6" />
                </TableCell>
                <TableCell className="px-3 py-3.5 sm:px-5">
                  <Skeleton className="ml-auto h-3.5 w-12" />
                </TableCell>
                <TableCell className="pr-3 sm:pr-4" />
              </TableRow>
            ))
          ) : conversations.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8} className="py-14">
                <EmptyState
                  icon={Inbox}
                  message="No conversations match these filters."
                  className="py-2"
                />
              </TableCell>
            </TableRow>
          ) : (
            conversations.map((c: Conversation) => {
              const DeviceIcon =
                DEVICE_ICON[c.client_metadata?.device_type ?? ""] ?? null;

              return (
                <TableRow
                  key={c.id}
                  role="link"
                  tabIndex={0}
                  className="group cursor-pointer border-border/50 hover:bg-primary/3"
                  onClick={() =>
                    router.push(`/dashboard/analytics/conversations/${c.id}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/dashboard/analytics/conversations/${c.id}`);
                    }
                  }}
                >
                  <TableCell className="max-w-70 px-4 py-3.5 whitespace-normal sm:max-w-90 sm:px-5">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                        {c.title || "Untitled conversation"}
                      </p>
                      {c.last_message_preview && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {c.last_message_preview}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-muted-foreground/90 md:hidden">
                        {c.chatbot_widget?.name ? (
                          <span className="truncate font-medium">{c.chatbot_widget.name}</span>
                        ) : c.page_url ? (
                          <span className="truncate">{safeHostname(c.page_url)}</span>
                        ) : (
                          <span className="capitalize">{c.source ?? "Platform"}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-[10px] text-muted-foreground/80">
                        {c.language && (
                          <span className="inline-flex items-center gap-0.5">
                            <Globe className="h-2.5 w-2.5" />
                            {formatLanguageLabel(c.language)}
                          </span>
                        )}
                        {DeviceIcon && c.client_metadata?.device_type && (
                          <span className="inline-flex items-center gap-0.5 capitalize">
                            <DeviceIcon className="h-2.5 w-2.5" />
                            {c.client_metadata.device_type}
                          </span>
                        )}
                        {c.page_url && (
                          <span className="hidden truncate max-w-35 lg:inline">
                            {safeHostname(c.page_url)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 sm:hidden">
                          <MessageSquare className="h-2.5 w-2.5" />
                          {c.message_count}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-3.5">
                    <SourceBadge source={c.source} />
                  </TableCell>

                  <TableCell className="hidden max-w-45 px-3 py-3.5 whitespace-normal md:table-cell">
                    <OriginCell conversation={c} />
                  </TableCell>

                  <TableCell className="max-w-40 px-3 py-3.5 whitespace-normal">
                    <CategoryCell conversation={c} />
                  </TableCell>

                  <TableCell className="hidden px-3 py-3.5 text-center sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {c.message_count}
                    </span>
                  </TableCell>

                  <TableCell className="hidden px-3 py-3.5 text-center lg:table-cell">
                    {c.satisfaction_rating === "positive" ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                        <ThumbsUp className="h-3 w-3" />
                      </span>
                    ) : c.satisfaction_rating === "negative" ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <ThumbsDown className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-3.5 text-right sm:px-5">
                    <span
                      className="text-[11px] tabular-nums text-muted-foreground"
                      title={new Date(c.created_at).toLocaleString()}
                    >
                      {timeAgo(c.created_at)}
                    </span>
                  </TableCell>

                  <TableCell className="pr-3 sm:pr-4">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex flex-col gap-3 border-t border-border/40 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {from.toLocaleString()}–{to.toLocaleString()}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {pagination.total.toLocaleString()}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 border-border/60 p-0"
                disabled={pagination.current_page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 border-border/60 p-0"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
