"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Loader2, Save, ShieldCheck, KeyRound, Globe, Bot } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetPreview } from "./WidgetPreview";
import { useWidgetConfig, useWidgetKeys, useUpdateWidgetConfig } from "../hooks/useWidget";
import { useLocalWidgetConfig } from "../hooks/useLocalWidgetConfig";
import type { WidgetConfig, WidgetPosition } from "../types/widget.types";

const POSITIONS: { label: string; value: WidgetPosition }[] = [
  { label: "Bottom Right", value: "bottom-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Top Right", value: "top-right" },
  { label: "Top Left", value: "top-left" },
];

const ATTRIBUTES = [
  { attr: "data-public-key", default: "required", description: "Your workspace public key" },
  { attr: "data-primary-color", default: "#3C6278", description: "Header gradient and launcher button color" },
  { attr: "data-user-message-color", default: "#6F0001", description: "Background color for visitor message bubbles" },
  { attr: "data-width", default: "460", description: "Panel width in pixels" },
  { attr: "data-height", default: "650", description: "Panel height in pixels" },
  { attr: "data-position", default: "bottom-right", description: "Placement: bottom-right, bottom-left, top-right, top-left" },
  { attr: "data-bot-name", default: "Hasab AI Chat", description: "Display name in the widget header" },
  { attr: "data-welcome-message", default: "Hello! How can I help you today?", description: "First message shown to visitors" },
  { attr: "data-avatar-text", default: "HA", description: "Initials shown on the bot avatar (2–3 chars)" },
];

export function InstallationPage() {
  const { data: serverConfig, isLoading: serverLoading } = useWidgetConfig();
  const { data: keys, isLoading: keysLoading } = useWidgetKeys();
  const { mutate: save, isPending: saving } = useUpdateWidgetConfig();
  const { config, setField, seedFromServer, ready, seeded } = useLocalWidgetConfig();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (serverConfig) seedFromServer(serverConfig);
  }, [serverConfig]);

  const set = <K extends keyof WidgetConfig>(key: K, val: WidgetConfig[K]) =>
    setField(key, val);

  const publicKey = keys?.public_key ?? "YOUR_PUBLIC_KEY";

  const snippet = `<script
  src="https://cdn.hasab.ai/widget.js"
  data-public-key="${publicKey}"
  data-width="${config.width}"
  data-height="${config.height}"
  data-primary-color="${config.primary_color}"
  data-user-message-color="${config.user_message_color}"
  data-position="${config.position}"
  data-bot-name="${config.bot_name}"
  data-welcome-message="${config.welcome_message}"
  data-avatar-text="${config.avatar_text}"
></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Snippet copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => save(config);

  const settingsLoading = !ready || (serverLoading && !seeded);
  const isLoading = settingsLoading || keysLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Widget Configuration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize the widget then copy the snippet to embed it on any webpage.
        </p>
      </div>

      {/* Settings + Preview */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* Colors & Dimensions */}
          <div className="rounded-xl border bg-card p-5 space-y-5">
            <div>
              <h2 className="text-sm font-semibold">Colors &amp; Dimensions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Controls the primary color, size, and screen position of the widget.
              </p>
            </div>

            {settingsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Primary Color
                  </Label>
                  <div className="flex gap-2 items-center">
                    <div className="relative h-9 w-9 rounded-md overflow-hidden border shrink-0">
                      <input
                        type="color"
                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        value={config.primary_color}
                        onChange={(e) => set("primary_color", e.target.value)}
                      />
                      <div className="absolute inset-0 rounded-md" style={{ background: config.primary_color }} />
                    </div>
                    <Input
                      value={config.primary_color}
                      onChange={(e) => set("primary_color", e.target.value)}
                      className="font-mono text-sm"
                      placeholder="#3C6278"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User Message Color
                  </Label>
                  <div className="flex gap-2 items-center">
                    <div className="relative h-9 w-9 rounded-md overflow-hidden border shrink-0">
                      <input
                        type="color"
                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        value={config.user_message_color}
                        onChange={(e) => set("user_message_color", e.target.value)}
                      />
                      <div className="absolute inset-0 rounded-md" style={{ background: config.user_message_color }} />
                    </div>
                    <Input
                      value={config.user_message_color}
                      onChange={(e) => set("user_message_color", e.target.value)}
                      className="font-mono text-sm"
                      placeholder="#6F0001"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Position
                  </Label>
                  <Select
                    value={config.position}
                    onValueChange={(v) => set("position", v as WidgetPosition)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Width (px)
                  </Label>
                  <Input
                    type="number"
                    value={config.width}
                    onChange={(e) => set("width", Number(e.target.value))}
                    min={240}
                    max={800}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Height (px)
                  </Label>
                  <Input
                    type="number"
                    value={config.height}
                    onChange={(e) => set("height", Number(e.target.value))}
                    min={300}
                    max={900}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="rounded-xl border bg-card p-5 space-y-5">
            <div>
              <h2 className="text-sm font-semibold">Identity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                How the bot introduces itself in the chat window.
              </p>
            </div>

            {settingsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bot Name
                  </Label>
                  <Input
                    value={config.bot_name}
                    onChange={(e) => set("bot_name", e.target.value)}
                    placeholder="Hasab AI Chat"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Avatar Initials
                  </Label>
                  <Input
                    value={config.avatar_text}
                    onChange={(e) => set("avatar_text", e.target.value.slice(0, 3))}
                    placeholder="HA"
                    maxLength={3}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Welcome Message
                  </Label>
                  <Input
                    value={config.welcome_message}
                    onChange={(e) => set("welcome_message", e.target.value)}
                    placeholder="Hello! How can I help you today?"
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            className="gap-2"
            disabled={settingsLoading || saving}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preview
          </p>
          <WidgetPreview config={config} />
        </div>
      </div>

      {/* CDN widget notice */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold">New: CDN Chatbot Widgets</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              The new widget flow uses per-widget configuration with session-token auth — no RSA keys in the browser. Each widget gets its own embed snippet with a public <code className="font-mono bg-muted px-0.5 rounded">data-widget-id</code>.
            </p>
          </div>
        </div>
        <Link href="/dashboard/widgets">
          <button className="text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
            Manage Chatbot Widgets →
          </button>
        </Link>
      </div>

      {/* How it works */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Legacy Authentication (Server-Side)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            The RSA key-pair flow below is for advanced server-side integrations. For browser-embedded CDN widgets, use the new session-token flow under Widgets.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex gap-3 items-start rounded-lg border bg-muted/20 px-4 py-3">
            <KeyRound className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Widget Key ID</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Your public identifier. Goes in <code className="font-mono bg-muted px-0.5 rounded">data-public-key</code> — safe to expose in browser code.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start rounded-lg border bg-muted/20 px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">RSA Signatures</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Every widget request is signed with <code className="font-mono bg-muted px-0.5 rounded">RSASSA-PKCS1-v1_5</code> + SHA-256 via your private key.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start rounded-lg border bg-muted/20 px-4 py-3">
            <Globe className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Origin Allowlist</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Requests are validated against your registered allowed origins. Manage in API Keys.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-[11px] text-destructive font-medium">
            Never embed your <code className="font-mono">HASAB_KEY</code> in browser code or the embed snippet. Use the Widget Key ID only.
          </p>
        </div>
      </div>

      {/* Embed Snippet */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Embed Snippet</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paste before the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">&lt;/body&gt;</code>{" "}
            tag on any webpage. The <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">data-public-key</code> is your Widget Key ID — it authenticates browser requests via <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">X-Widget-Key-Id</code>.
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
                <span className="text-[#ff9f43]">&quot;{config.width}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-height</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{config.height}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-primary-color</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{config.primary_color}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-user-message-color</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{config.user_message_color}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-position</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{config.position}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-bot-name</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{config.bot_name}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-welcome-message</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{config.welcome_message}&quot;</span>
                {"\n  "}
                <span className="text-[#64d2ff]">data-avatar-text</span>
                <span className="text-white">=</span>
                <span className="text-[#ff9f43]">&quot;{config.avatar_text}&quot;</span>
                {"\n"}
                <span className="text-[#7c7cff]">&gt;&lt;/script&gt;</span>
              </code>
            </pre>
          </div>
        )}

        <Button
          className="gap-2"
          onClick={handleCopy}
          disabled={isLoading}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Snippet"}
        </Button>
      </div>

      {/* Attributes reference */}
      {/* <div className="rounded-xl border bg-card p-5 space-y-4">
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
      </div> */}
    </div>
  );
}
