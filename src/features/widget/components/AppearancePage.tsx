"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetPreview } from "./WidgetPreview";
import { useWidgetConfig, useUpdateWidgetConfig } from "../hooks/useWidget";
import { useLocalWidgetConfig } from "../hooks/useLocalWidgetConfig";
import type { WidgetConfig, WidgetPosition } from "../types/widget.types";

const POSITIONS: { label: string; value: WidgetPosition }[] = [
  { label: "Bottom Right", value: "bottom-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Top Right", value: "top-right" },
  { label: "Top Left", value: "top-left" },
];

export function AppearancePage() {
  const { data: serverConfig, isLoading: serverLoading } = useWidgetConfig();
  const { mutate: save, isPending: saving } = useUpdateWidgetConfig();
  const { config, setField, seedFromServer, ready, seeded } = useLocalWidgetConfig();

  // Seed localStorage from server on first ever use (no stored data yet)
  useEffect(() => {
    if (serverConfig) seedFromServer(serverConfig);
  }, [serverConfig]);

  const set = <K extends keyof WidgetConfig>(key: K, val: WidgetConfig[K]) =>
    setField(key, val);

  const handleSave = () => save(config);

  // Show skeleton only before localStorage is read, or if server is loading and
  // there's nothing in localStorage yet (first ever visit).
  if (!ready || (serverLoading && !seeded)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Widget Appearance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize how the Hasab AI Chat widget looks on your customers&apos; websites.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Colors & Dimensions */}
          <div className="rounded-xl border bg-card p-5 space-y-5">
            <div>
              <h2 className="text-sm font-semibold">Colors &amp; Dimensions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Controls the primary color, size, and screen position of the widget.
              </p>
            </div>

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
                    <div
                      className="absolute inset-0 rounded-md"
                      style={{ background: config.primary_color }}
                    />
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
                    <div
                      className="absolute inset-0 rounded-md"
                      style={{ background: config.user_message_color }}
                    />
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
          </div>

          {/* Identity */}
          <div className="rounded-xl border bg-card p-5 space-y-5">
            <div>
              <h2 className="text-sm font-semibold">Identity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                How the bot introduces itself in the chat window.
              </p>
            </div>

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
          </div>

          <div className="flex gap-3">
            <Button
              style={{ background: config.primary_color }}
              className="text-white hover:opacity-90 transition-opacity"
              disabled={saving}
              onClick={handleSave}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard/installation">Copy Snippet</a>
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preview
          </p>
          <WidgetPreview config={config} />
        </div>
      </div>
    </div>
  );
}
