"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bot, ShieldCheck, Clock, Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatbotWidgets } from "../hooks/useChatbotWidgets";
import { WidgetCard } from "./WidgetCard";
import { SnippetModal } from "./SnippetModal";
import { ChannelLimitBanner } from "@/features/channel-limit/components/ChannelLimitBanner";
import { canCreateChannel, useChannelLimit } from "@/features/channel-limit/hooks/useChannelLimit";
import type { ChatbotWidget } from "../types/chatbot-widget.types";

export function ChatbotWidgetsPage() {
  const router = useRouter();
  const { data: widgets, isLoading } = useChatbotWidgets();
  const { data: channelLimit } = useChannelLimit();
  const canCreate = canCreateChannel(channelLimit);
  const [snippetWidget, setSnippetWidget] = useState<ChatbotWidget | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Chatbot Widgets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage embeddable chatbot widgets. Each widget gets a unique script snippet
            to paste on any webpage.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/widgets/new")}
          className="shrink-0 gap-2"
          disabled={!canCreate}
          title={!canCreate ? "Channel limit reached" : undefined}
        >
          <Plus className="h-4 w-4" />
          New Widget
        </Button>
      </div>

      <ChannelLimitBanner />

      {/* How it works */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex gap-3 items-start rounded-xl border bg-muted/20 px-4 py-3">
          <Globe className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Allowed Origins</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              The widget only loads on domains you explicitly allow. Only full origins are accepted —{" "}
              <code className="font-mono bg-muted px-0.5 rounded">https://example.com</code>.
            </p>
          </div>
        </div>
        <div className="flex gap-3 items-start rounded-xl border bg-muted/20 px-4 py-3">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Session Tokens</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              The browser script uses only the public <code className="font-mono bg-muted px-0.5 rounded">widget_id</code>. Auth is handled via short-lived visitor session tokens — no private keys in the browser.
            </p>
          </div>
        </div>
        
        
        <div className="flex gap-3 items-start rounded-xl border bg-muted/20 px-4 py-3">
          <Languages className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Multilingual Ready</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Visitors can switch language in the widget. Quick prompts, welcome text, and UI labels update automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Widget list */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : !widgets || widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/10 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">No widgets yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first chatbot widget to get an embed snippet.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/widgets/new")}
            className="gap-2"
            disabled={!canCreate}
          >
            <Plus className="h-4 w-4" />
            Create Widget
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onSnippet={(w) => setSnippetWidget(w)}
            />
          ))}
        </div>
      )}

      {/* Snippet modal */}
      <SnippetModal
        widget={snippetWidget}
        open={!!snippetWidget}
        onOpenChange={(open) => { if (!open) setSnippetWidget(null); }}
      />
    </div>
  );
}
