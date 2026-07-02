"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Globe,
  ExternalLink,
  User,
  MessageSquare,
  Calendar,
  Clock,
  Activity,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { analyticsApi } from "../api/analytics.api";
import { useConversationDetail } from "../hooks/useConversations";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname || url;
  } catch {
    return url;
  }
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  am: "Amharic",
  om: "Oromo",
  tir: "Tigrinya",
};

const SOURCE_BADGE: Record<string, string> = {
  widget: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  web: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  mobile: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[11px] font-medium text-muted-foreground shrink-0 pt-0.5">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

interface Props {
  id: number;
}

export function ConversationDetailPage({ id }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useConversationDetail(id);

  const { mutate: submitFeedback, isPending: feedbackPending } = useMutation({
    mutationFn: analyticsApi.postFeedback,
    onSuccess: (_, vars) => {
      toast.success(`Marked as ${vars.rating}`);
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Failed to submit feedback"),
  });

  const firstMsgAt = data?.messages[0]?.created_at;
  const lastMsgAt = data?.messages[data?.messages.length - 1]?.created_at;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-1 mt-0.5 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            {isLoading ? (
              <Skeleton className="h-5 w-64 mt-0.5" />
            ) : (
              <h1 className="text-lg font-semibold leading-snug">
                {data?.title || "Untitled conversation"}
              </h1>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">Conversation #{id}</p>
          </div>
        </div>

        {/* Rating actions */}
        {(data || isLoading) && (
          <div className="flex items-center gap-2 shrink-0">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={data?.satisfaction_rating === "positive" ? "default" : "outline"}
                  className="gap-1.5"
                  disabled={feedbackPending}
                  onClick={() => submitFeedback({ chat_history_id: id, rating: "positive" })}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Positive
                </Button>
                <Button
                  size="sm"
                  variant={data?.satisfaction_rating === "negative" ? "destructive" : "outline"}
                  className="gap-1.5"
                  disabled={feedbackPending}
                  onClick={() => submitFeedback({ chat_history_id: id, rating: "negative" })}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Negative
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Body grid */}
      <div className="grid gap-5 lg:grid-cols-[260px_1fr] items-start">
        {/* ── Visitor info ── */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          {/* Avatar + session */}
          <div className="flex flex-col items-center text-center gap-2.5 pb-4 border-b">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Visitor</p>
              {isLoading ? (
                <Skeleton className="h-3 w-20 mt-1.5 mx-auto" />
              ) : (
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  #{data?.visitor_session_id?.slice(0, 8) ?? "anonymous"}
                </p>
              )}
            </div>
          </div>

          {/* Metadata rows */}
          <dl className="space-y-3.5">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center gap-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))
            ) : (
              <>
                {data?.visitor_session_id && (
                  <InfoRow label="Session ID">
                    <span className="font-mono text-[10px] text-muted-foreground break-all leading-relaxed">
                      {data.visitor_session_id}
                    </span>
                  </InfoRow>
                )}

                {data?.source && (
                  <InfoRow label="Source">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                        SOURCE_BADGE[data.source] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      <Tag className="h-2.5 w-2.5 inline mr-0.5" />
                      {data.source}
                    </span>
                  </InfoRow>
                )}

                {data?.language && (
                  <InfoRow label="Language">
                    <span className="text-xs flex items-center gap-1">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      {LANGUAGE_LABELS[data.language] ?? data.language}
                    </span>
                  </InfoRow>
                )}

                {data?.page_url && (
                  <InfoRow label="Page URL">
                    <a
                      href={data.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline max-w-[140px] truncate"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {safePathname(data.page_url)}
                    </a>
                  </InfoRow>
                )}

                <InfoRow label="Messages">
                  <span className="text-xs flex items-center justify-end gap-1">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    {data?.message_count ?? 0}
                  </span>
                </InfoRow>

                {firstMsgAt && (
                  <InfoRow label="Started">
                    <span className="text-xs flex items-center justify-end gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {fmtDate(firstMsgAt)}
                    </span>
                  </InfoRow>
                )}

                {lastMsgAt && lastMsgAt !== firstMsgAt && (
                  <InfoRow label="Last Active">
                    <span className="text-xs flex items-center justify-end gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      {fmtDate(lastMsgAt)}
                    </span>
                  </InfoRow>
                )}

                <InfoRow label="Rating">
                  {data?.satisfaction_rating === "positive" ? (
                    <span className="flex items-center justify-end gap-1 text-xs text-green-600">
                      <ThumbsUp className="h-3 w-3" /> Positive
                    </span>
                  ) : data?.satisfaction_rating === "negative" ? (
                    <span className="flex items-center justify-end gap-1 text-xs text-destructive">
                      <ThumbsDown className="h-3 w-3" /> Negative
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not rated</span>
                  )}
                </InfoRow>
              </>
            )}
          </dl>
        </div>

        {/* ── Conversation transcript ── */}
        <div className="rounded-xl border bg-card p-5 flex flex-col">
          <h2 className="text-sm font-semibold mb-5 flex-shrink-0">Transcript</h2>

          <div className="overflow-y-auto max-h-[70vh] space-y-5 pr-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={cn("flex flex-col gap-1.5", i % 2 === 0 ? "items-end" : "items-start")}
                >
                  <Skeleton className="h-3 w-24" />
                  <Skeleton
                    className={cn("h-14 rounded-xl", i % 2 === 0 ? "w-64" : "w-72")}
                  />
                </div>
              ))
            ) : data?.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">
                No messages in this conversation.
              </p>
            ) : (
              data?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-1",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                    <span className="font-medium">
                      {msg.role === "user" ? "Visitor" : "Hasab AI"}
                    </span>
                    <span>·</span>
                    <span>{fmtDate(msg.created_at)}</span>
                    {msg.response_time_ms != null && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {(msg.response_time_ms / 1000).toFixed(1)}s
                        </span>
                      </>
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
