"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ChatbotWidget } from "../types/chatbot-widget.types";
import { normalizeWidgetSettings } from "../utils/normalizeSettings";
import { normalizeUiLanguageCode } from "../utils/languageCodes";

interface SnippetModalProps {
  widget: ChatbotWidget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Bump when widget script behavior changes — busts browser/CDN caches on embed pages. */
const WIDGET_SCRIPT_VERSION = "20260822b";

/** CDN script URL — localhost copies use the patched script from /public. */
export function getWidgetScriptSrc(origin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
  const base = (() => {
    if (fromEnv) return fromEnv.replace(/\?.*$/, "");

    if (origin) {
      try {
        const { hostname } = new URL(origin);
        if (hostname === "localhost" || hostname === "127.0.0.1") {
          return `${origin.replace(/\/$/, "")}/widget/v1/hasab-chatbot.js`;
        }
      } catch {
        /* fall through */
      }
    }

    return "https://api.hasab.ai/widget/v1/hasab-chatbot.js";
  })();

  return `${base}?v=${WIDGET_SCRIPT_VERSION}`;
}

/** Keeps single-quoted HTML attributes safe when a value contains a quote, <, >, or &. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;");
}

/** Builds the exact set of data-* attributes for a widget — the single source of
 * truth for both the copied snippet and the displayed code block, so the two
 * can never drift apart. theme/settings are serialized whole (not hand-mapped
 * field by field) so every configured value — including nested launcher/mic/send
 * overrides — is guaranteed to be carried into the tag exactly as saved. */
function buildAttrs(widget: ChatbotWidget): [string, string][] {
  const settings = normalizeWidgetSettings(widget.settings);
  return [
    ["data-widget-id", widget.widget_id],
    ["data-position", widget.position],
    ["data-default-language", normalizeUiLanguageCode(widget.default_language)],
    ["data-welcome-message", widget.welcome_message],
    ["data-theme", JSON.stringify(widget.theme)],
    ["data-settings", JSON.stringify(settings)],
  ];
}

export function SnippetModal({ widget, open, onOpenChange }: SnippetModalProps) {
  const [copied, setCopied] = useState(false);

  if (!widget) return null;

  const settings = normalizeWidgetSettings(widget.settings);
  const scriptSrc = getWidgetScriptSrc(
    typeof window !== "undefined" ? window.location.origin : undefined
  );
  const attrs = buildAttrs(widget);
  const ttsEnabled = settings.features?.tts === true;

  const snippet = [
    "<script",
    "  async",
    `  src="${scriptSrc}"`,
    ...attrs.map(([key, value]) => `  ${key}='${escapeAttr(value)}'`),
    "></script>",
  ].join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Embed Snippet — {widget.name}</DialogTitle>
          <DialogDescription>
            Paste this before the{" "}
            <code className="font-mono text-xs bg-muted px-1 rounded">&lt;/body&gt;</code> tag on
            any page listed in your allowed origins. Theme and settings are embedded directly in
            the tag, so the widget renders with this exact configuration immediately — no separate
            fetch required to match what you built here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Embed Snippet
            </p>
            <div className="rounded-xl bg-[#1a1a2e] p-4 overflow-x-auto max-h-80 overflow-y-auto">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap break-all">
                <code>
                  <span className="text-[#7c7cff]">&lt;script</span>
                  {"\n  "}
                  <span className="text-[#64d2ff]">async</span>
                  {"\n  "}
                  <span className="text-[#64d2ff]">src</span>
                  <span className="text-white">=</span>
                  <span className="text-[#ff9f43]">&quot;{scriptSrc}&quot;</span>
                  {attrs.map(([key, value]) => (
                    <span key={key}>
                      {"\n  "}
                      <span className="text-[#64d2ff]">{key}</span>
                      <span className="text-white">=</span>
                      <span className="text-[#ff9f43]">&#39;{escapeAttr(value)}&#39;</span>
                    </span>
                  ))}
                  {">\n"}
                  <span className="text-[#7c7cff]">&lt;/script&gt;</span>
                </code>
              </pre>
            </div>
          </div>

          {/* Security note */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 space-y-1">
            <p className="text-[11px] font-semibold text-primary">How the widget authenticates</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Only <code className="font-mono bg-muted px-0.5 rounded">data-widget-id</code> is used to
              create a short-lived visitor session token and resolve knowledge base access. The{" "}
              <code className="font-mono bg-muted px-0.5 rounded">data-theme</code> /{" "}
              <code className="font-mono bg-muted px-0.5 rounded">data-settings</code> attributes are
              public appearance config only. No{" "}
              <code className="font-mono bg-muted px-0.5 rounded">HASAB_KEY</code> or RSA private key
              is ever sent to the browser.
            </p>
          </div>

          {ttsEnabled ? (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                TTS replies
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This snippet includes{" "}
                <code className="font-mono bg-muted px-0.5 rounded">features.tts: true</code>.
                On allowed origins, assistant replies include Amharic audio (Tigist) only when the visitor selects Amharic. English and Oromo get text-only replies.
              </p>
            </div>
          ) : null}

          <Button className="w-full gap-2" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Snippet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
