"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Radio,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { TelegramBot } from "../types/telegram-bot.types";
import { useDeleteTelegramBot } from "../hooks/useTelegramBots";
import { timeAgo } from "../utils/format";

interface TelegramBotCardProps {
  bot: TelegramBot;
}

export function TelegramBotCard({ bot }: TelegramBotCardProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: deleteBot, isPending: deleting } = useDeleteTelegramBot();

  return (
    <>
      <div className="space-y-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{bot.name}</h3>
              {bot.is_active ? (
                <span className="flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                  <XCircle className="h-2.5 w-2.5" />
                  Inactive
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {bot.bot_username ? (
                <span className="inline-flex items-center gap-0.5 font-mono">
                  <AtSign className="h-3 w-3" />
                  {bot.bot_username}
                </span>
              ) : (
                <span className="font-mono text-muted-foreground/70">No username</span>
              )}
              <span className="rounded bg-muted/50 px-1.5 py-0.5 capitalize">{bot.mode}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Edit bot"
              onClick={() => router.push(`/dashboard/telegram-bots/${bot.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              title="Delete bot"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Radio className="h-3 w-3 shrink-0" />
            <span>
              Last webhook:{" "}
              <span className="text-foreground/80">{timeAgo(bot.last_webhook_at)}</span>
            </span>
          </div>
          <code className="block truncate font-mono text-[10px] text-muted-foreground/80">
            {bot.bot_token_masked}
          </code>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 text-xs"
            onClick={() => router.push(`/dashboard/telegram-bots/${bot.id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Configure
          </Button>
          {bot.telegram_url && (
            <Button variant="outline" size="sm" className="gap-2 text-xs" asChild>
              <a href={bot.telegram_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </a>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{bot.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              Soft-deletes the bot and best-effort removes the Telegram webhook. Inbox history is
              kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={deleting}
              onClick={() =>
                deleteBot(bot.id, { onSuccess: () => setConfirmDelete(false) })
              }
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
