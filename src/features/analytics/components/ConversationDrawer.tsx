"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, ExternalLink, Globe, Tag, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyticsApi } from "../api/analytics.api";
import { useConversationDetail } from "../hooks/useConversations";

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

interface ConversationDrawerProps {
  id: number | null;
  onClose: () => void;
}

export function ConversationDrawer({ id, onClose }: ConversationDrawerProps) {
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

  return (
    <Sheet open={id != null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full sm:max-w-lg flex flex-col p-0 gap-0"
        showCloseButton={true}
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b flex-shrink-0">
          <SheetTitle className="text-sm font-semibold leading-snug pr-8">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              (data?.title || "Untitled conversation")
            )}
          </SheetTitle>
          {data && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
              {data.source && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {data.source}
                </span>
              )}
              {data.language && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {data.language}
                </span>
              )}
              {data.page_url && (
                <a
                  href={data.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {safePathname(data.page_url)}
                </a>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                <Skeleton className={cn("h-12 rounded-xl", i % 2 === 0 ? "w-52" : "w-64")} />
              </div>
            ))
          ) : data?.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
          ) : (
            data?.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.response_time_ms != null && (
                    <p className="text-[10px] mt-1 opacity-60 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {(msg.response_time_ms / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Feedback */}
        {data && (
          <div className="border-t px-5 py-4 flex-shrink-0">
            <p className="text-xs text-muted-foreground mb-2.5">Conversation rating</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={data.satisfaction_rating === "positive" ? "default" : "outline"}
                className="gap-1.5"
                disabled={feedbackPending}
                onClick={() => submitFeedback({ chat_history_id: data.id, rating: "positive" })}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Positive
              </Button>
              <Button
                size="sm"
                variant={data.satisfaction_rating === "negative" ? "destructive" : "outline"}
                className="gap-1.5"
                disabled={feedbackPending}
                onClick={() => submitFeedback({ chat_history_id: data.id, rating: "negative" })}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                Negative
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
