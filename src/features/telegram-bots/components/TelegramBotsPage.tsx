"use client";

import { useRouter } from "next/navigation";
import { Plus, Send, ShieldCheck, AppWindow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTelegramBots } from "../hooks/useTelegramBots";
import { TelegramBotCard } from "./TelegramBotCard";
import { ChannelLimitBanner } from "@/features/channel-limit/components/ChannelLimitBanner";
import { canCreateChannel, useChannelLimit } from "@/features/channel-limit/hooks/useChannelLimit";

export function TelegramBotsPage() {
  const router = useRouter();
  const { data, isLoading } = useTelegramBots();
  const { data: channelLimit } = useChannelLimit();
  const canCreate = canCreateChannel(channelLimit);
  const bots = data?.bots ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Telegram Bots</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Connect BotFather tokens to Hasab chat — native Telegram messaging, voice, ACL, and Mini
            Apps.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/telegram-bots/new")}
          className="shrink-0 gap-2"
          disabled={!canCreate}
          title={!canCreate ? "Channel limit reached" : undefined}
        >
          <Plus className="h-4 w-4" />
          New Bot
        </Button>
      </div>

      <ChannelLimitBanner />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border bg-muted/20 px-4 py-3">
          <Send className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold">BotFather token</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Paste a bot token to validate via Telegram <code className="rounded bg-muted px-0.5 font-mono">getMe</code> and
              register the webhook automatically.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border bg-muted/20 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold">Phone allowlist</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Optionally require visitors to share a phone number. Only hashed last4 digits are
              returned to the portal.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border bg-muted/20 px-4 py-3">
          <AppWindow className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold">Mini App + voice</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Point a HTTPS Mini App URL at your CDN widget page, and optionally enable Telegram
              voice notes for ASR.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/10 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">No Telegram bots yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a bot with a BotFather token to start receiving messages in the inbox.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/telegram-bots/new")}
            className="gap-2"
            disabled={!canCreate}
          >
            <Plus className="h-4 w-4" />
            Create Bot
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <TelegramBotCard key={bot.id} bot={bot} />
          ))}
        </div>
      )}
    </div>
  );
}
