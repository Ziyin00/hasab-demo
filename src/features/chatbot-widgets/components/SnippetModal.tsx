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

interface SnippetModalProps {
  widget: ChatbotWidget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SnippetModal({ widget, open, onOpenChange }: SnippetModalProps) {
  const [copied, setCopied] = useState(false);

  if (!widget) return null;

  const snippet =
    widget.snippet ??
    `<script\n  async\n  src="https://api.hasab.ai/widget/v1/hasab-chatbot.js"\n  data-widget-id="${widget.widget_id}">\n</script>`;

  const cdnSnippet = `<script\n  async\n  src="https://cdn.hasab.ai/widget/v1/hasab-chatbot.js"\n  data-widget-id="${widget.widget_id}">\n</script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Embed Snippet — {widget.name}</DialogTitle>
          <DialogDescription>
            Paste this before the{" "}
            <code className="font-mono text-xs bg-muted px-1 rounded">&lt;/body&gt;</code> tag on
            any page listed in your allowed origins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current snippet */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Current (API host)
            </p>
            <div className="rounded-xl bg-[#1a1a2e] p-4 overflow-x-auto">
              <pre className="text-sm leading-relaxed whitespace-pre">
                <code>
                  <span className="text-[#7c7cff]">&lt;script</span>
                  {"\n  "}
                  <span className="text-[#64d2ff]">async</span>
                  {"\n  "}
                  <span className="text-[#64d2ff]">src</span>
                  <span className="text-white">=</span>
                  <span className="text-[#ff9f43]">&quot;https://api.hasab.ai/widget/v1/hasab-chatbot.js&quot;</span>
                  {"\n  "}
                  <span className="text-[#64d2ff]">data-widget-id</span>
                  <span className="text-white">=</span>
                  <span className="text-[#ff9f43]">&quot;{widget.widget_id}&quot;</span>
                  {">\n"}
                  <span className="text-[#7c7cff]">&lt;/script&gt;</span>
                </code>
              </pre>
            </div>
          </div>

          {/* Future CDN snippet */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Future (CDN host — swap src when cdn.hasab.ai is ready)
            </p>
            <div className="rounded-xl bg-[#1a1a2e] p-4 overflow-x-auto">
              <pre className="text-sm leading-relaxed whitespace-pre">
                <code>
                  <span className="text-[#7c7cff]">&lt;script</span>
                  {"\n  "}
                  <span className="text-[#64d2ff]">async</span>
                  {"\n  "}
                  <span className="text-[#64d2ff]">src</span>
                  <span className="text-white">=</span>
                  <span className="text-[#ff9f43]">&quot;https://cdn.hasab.ai/widget/v1/hasab-chatbot.js&quot;</span>
                  {"\n  "}
                  <span className="text-[#64d2ff]">data-widget-id</span>
                  <span className="text-white">=</span>
                  <span className="text-[#ff9f43]">&quot;{widget.widget_id}&quot;</span>
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
              The script uses <strong>only</strong> the public <code className="font-mono bg-muted px-0.5 rounded">data-widget-id</code> to load config and create a short-lived visitor session token. No{" "}
              <code className="font-mono bg-muted px-0.5 rounded">HASAB_KEY</code> or RSA private key is ever sent to the browser.
            </p>
          </div>

          <Button className="w-full gap-2" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Current Snippet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
