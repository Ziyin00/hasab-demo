"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "../hooks/useWidget";
import { useWidgetKeys } from "../hooks/useWidget";

const ATTRIBUTES = [
  { attr: "data-public-key", default: "required", description: "Your workspace public key" },
  { attr: "data-primary-color", default: "#3C6278", description: "Header gradient and launcher button color" },
  { attr: "data-user-message-color", default: "#6F0001", description: "Background color for visitor message bubbles" },
  { attr: "data-width", default: "460", description: "Panel width in pixels" },
  { attr: "data-height", default: "650", description: "Panel height in pixels" },
  { attr: "data-position", default: "bottom-right", description: 'Placement: bottom-right, bottom-left, top-right, top-left' },
  { attr: "data-bot-name", default: "Hasab AI Chat", description: "Display name in the widget header" },
  { attr: "data-welcome-message", default: "Hello! How can I help you today?", description: "First message shown to visitors" },
  { attr: "data-avatar-text", default: "HA", description: "Initials shown on the bot avatar (2–3 chars)" },
];

export function InstallationPage() {
  const { data: config, isLoading: configLoading } = useWidgetConfig();
  const { data: keys, isLoading: keysLoading } = useWidgetKeys();
  const [copied, setCopied] = useState(false);

  const publicKey = keys?.public_key ?? "YOUR_PUBLIC_KEY";
  const color = config?.primary_color ?? "#3C6278";
  const userMsgColor = config?.user_message_color ?? "#6F0001";
  const width = config?.width ?? 460;
  const height = config?.height ?? 650;
  const position = config?.position ?? "bottom-right";
  const botName = config?.bot_name ?? "Hasab AI Chat";
  const welcome = config?.welcome_message ?? "Hello! How can I help you today?";
  const avatar = config?.avatar_text ?? "HA";

  const snippet = `<script
  src="https://cdn.hasab.ai/widget.js"
  data-public-key="${publicKey}"
  data-width="${width}"
  data-height="${height}"
  data-primary-color="${color}"
  data-user-message-color="${userMsgColor}"
  data-position="${position}"
  data-bot-name="${botName}"
  data-welcome-message="${welcome}"
  data-avatar-text="${avatar}"
></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Snippet copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = configLoading || keysLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Installation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Paste this snippet before the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">&lt;/body&gt;</code>{" "}
          tag on any webpage. The widget loads automatically.
        </p>
      </div>

      {/* Snippet card */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Embed Snippet</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            One script tag. No build step, no dependencies.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-52 w-full rounded-xl" />
        ) : (
          <div className="rounded-xl bg-[#1a1a2e] p-5 overflow-x-auto">
            <pre className="text-sm leading-relaxed">
              <code>
                <span className="text-[#7c7cff]">&lt;script</span>
                {"\n  "}
                <span className="text-[#64d2ff]">src</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;https://cdn.hasab.ai/widget.js&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-public-key</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{publicKey}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-width</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{width}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-height</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{height}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-primary-color</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{color}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-user-message-color</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{userMsgColor}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-position</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{position}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-bot-name</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{botName}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-welcome-message</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{welcome}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-avatar-text</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{avatar}&quot;</span>
                {"\n"}
                <span className="text-[#7c7cff]">&gt;&lt;/script&gt;</span>
              </code>
            </pre>
          </div>
        )}

        <Button
          style={{ background: color }}
          className="text-white hover:opacity-90 transition-opacity gap-2"
          onClick={handleCopy}
          disabled={isLoading}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Snippet"}
        </Button>
      </div>

      {/* Attributes table */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">All Attributes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every configurable option available on the script tag.
          </p>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Attribute</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Default</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Description</th>
              </tr>
            </thead>
            <tbody>
              {ATTRIBUTES.map((row, i) => (
                <tr key={row.attr} className={i < ATTRIBUTES.length - 1 ? "border-b" : ""}>
                  <td className="px-4 py-3">
                    <code className="text-[12px] font-mono text-primary">{row.attr}</code>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.default}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
