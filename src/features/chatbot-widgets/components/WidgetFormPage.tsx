"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AllowedOriginsEditor } from "./AllowedOriginsEditor";
import { ThemeEditor } from "./ThemeEditor";
import { SettingsEditor } from "./SettingsEditor";
import { CategoriesEditor } from "./CategoriesEditor";
import type {
  ChatbotWidget,
  ChatbotWidgetTheme,
  ChatbotWidgetSettings,
  CreateChatbotWidgetPayload,
  WidgetPosition,
} from "../types/chatbot-widget.types";
import {
  useCreateChatbotWidget,
  useUpdateChatbotWidget,
} from "../hooks/useChatbotWidgets";
import { normalizeQuickPrompts } from "../utils/quickPrompts";
import { normalizeWidgetSettings } from "../utils/normalizeSettings";
import { normalizeUiLanguageCode } from "../utils/languageCodes";

const POSITIONS: { label: string; value: WidgetPosition }[] = [
  { label: "Bottom Right", value: "bottom-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Top Right", value: "top-right" },
  { label: "Top Left", value: "top-left" },
];

const DEFAULT_THEME: ChatbotWidgetTheme = {
  primary_color: "#0f766e",
  panel_background: "#ffffff",
  message_area_background: "#f8fafc",
  text_color: "#111827",
  bot_message_background: "#ecfeff",
  bot_message_text_color: "#134e4a",
  user_message_background: "#0f766e",
  user_message_text_color: "#ffffff",
  chip_background: "#ccfbf1",
  chip_text_color: "#115e59",
  border_color: "#99f6e4",
  font_family: "Inter, system-ui, sans-serif",
  border_radius: "18px",
  panel_width: "400px",
  panel_height: "580px",
  launcher_size: "64px",
  launcher: { type: "text", label: "Ask", icon_url: null, background_color: "#0f766e", text_color: "#ffffff" },
  header: { avatar_url: null, avatar_initials: "AF" },
  mic: {
    label: "", recording_label: "Stop", processing_label: "Wait",
    icon_url: null, recording_icon_url: null,
    background_color: "#475569", recording_background_color: "#dc2626",
    processing_background_color: "#d97706", text_color: "#ffffff",
  },
  send: { label: "Send", icon_url: null },
};

const DEFAULT_SETTINGS: ChatbotWidgetSettings = {
  title: "Hasab AI",
  subtitle: "Ready to help",
  launcher_label: "Ask",
  input_placeholder: "Ask in your language...",
  show_language_selector: true,
  languages: [
    { code: "en", label: "English" },
    { code: "am", label: "Amharic" },
    { code: "om", label: "Oromo" },
  ],
  quick_prompts: {},
  features: { audio_upload: false, tts: false, quick_prompts: true, language_selector: true },
};

function emptyForm(): CreateChatbotWidgetPayload {
  return {
    name: "",
    allowed_origins: [],
    welcome_message: "Hi, how can I help?",
    default_language: "en",
    position: "bottom-right",
    theme: { ...DEFAULT_THEME },
    settings: { ...DEFAULT_SETTINGS },
    chat_context_ids: [],
    rag_store_ids: [],
    rate_limit_per_minute: 60,
    is_active: true,
  };
}

interface WidgetFormPageProps {
  widget?: ChatbotWidget | null;
  loading?: boolean;
}

export function WidgetFormPage({ widget, loading }: WidgetFormPageProps) {
  const router = useRouter();
  const isEdit = !!widget;

  const { mutate: create, isPending: creating } = useCreateChatbotWidget();
  const { mutate: update, isPending: updating } = useUpdateChatbotWidget();
  const isPending = creating || updating;

  const [form, setForm] = useState<CreateChatbotWidgetPayload>(emptyForm);
  const [contextIdsRaw, setContextIdsRaw] = useState("");
  const [ragIdsRaw, setRagIdsRaw] = useState("");

  useEffect(() => {
    if (widget) {
      const { id, widget_id, snippet, ...rest } = widget;
      void id; void widget_id; void snippet;
      const payload = rest as CreateChatbotWidgetPayload;
      setForm({
        ...payload,
        settings: normalizeWidgetSettings({
          ...payload.settings,
          quick_prompts: normalizeQuickPrompts(
            payload.settings?.quick_prompts,
            payload.settings?.languages
          ),
        }),
      });
      setContextIdsRaw(widget.chat_context_ids.join(", "));
      setRagIdsRaw(widget.rag_store_ids.join(", "));
    }
  }, [widget]);

  const set = <K extends keyof CreateChatbotWidgetPayload>(
    key: K,
    val: CreateChatbotWidgetPayload[K]
  ) => setForm((prev) => ({ ...prev, [key]: val }));

  const parseIds = (raw: string): number[] =>
    raw.split(/[,\s]+/).map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));

  const handleSave = () => {
    const payload: CreateChatbotWidgetPayload = {
      ...form,
      default_language: normalizeUiLanguageCode(form.default_language),
      chat_context_ids: parseIds(contextIdsRaw),
      rag_store_ids: parseIds(ragIdsRaw),
      settings: normalizeWidgetSettings({
        ...form.settings,
        quick_prompts: normalizeQuickPrompts(
          form.settings?.quick_prompts,
          form.settings?.languages
        ),
      }),
    };
    if (!payload.name.trim()) return;

    if (isEdit && widget) {
      update({ id: widget.id, payload }, { onSuccess: () => router.push("/dashboard/widgets") });
    } else {
      create(payload, { onSuccess: () => router.push("/dashboard/widgets") });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <Button
        variant="ghost"
        size="sm"
        className=" -ml-1 -mt-16 shrink-0"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center -mt-4 justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            {loading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <h1 className="text-lg font-semibold">
                {isEdit ? `Edit: ${widget!.name}` : "New Widget"}
              </h1>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit
                ? "Update widget configuration. Changes apply immediately after saving."
                : "Configure your chatbot widget. You'll get an embed snippet to paste on any site."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !form.name.trim() || loading}
            className="gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPending ? "Saving…" : "Save Widget"}
          </Button>
        </div>
      </div>

      {/* Form tabs */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Tabs defaultValue="general">
            <TabsList className="w-full justify-start rounded-t-xl rounded-b-none border-b h-11 px-4 gap-1 bg-transparent">
              <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
              <TabsTrigger value="origins" className="text-xs">Origins</TabsTrigger>
              <TabsTrigger value="theme" className="text-xs">Theme</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
              {isEdit && <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>}
              <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="px-6 py-6 space-y-5 mt-0">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Widget Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Customer website support"
                  className="text-sm"
                />
                <p className="text-[11px] text-muted-foreground">Internal name — shown in the portal only.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Welcome Message
                </Label>
                <Textarea
                  value={form.welcome_message}
                  onChange={(e) => set("welcome_message", e.target.value)}
                  placeholder="Hi, how can I help?"
                  className="text-sm resize-none"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Position
                  </Label>
                  <Select value={form.position} onValueChange={(v) => set("position", v as WidgetPosition)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Default Language
                  </Label>
                  <Input
                    value={form.default_language}
                    onChange={(e) => set("default_language", e.target.value)}
                    placeholder="en"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Rate Limit (req/min)
                  </Label>
                  <Input
                    type="number"
                    value={form.rate_limit_per_minute}
                    onChange={(e) => set("rate_limit_per_minute", Number(e.target.value))}
                    min={1}
                    max={300}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Inactive widgets return 404 to the browser script.</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
              </div>
            </TabsContent>

            {/* Origins */}
            <TabsContent value="origins" className="px-6 py-6 mt-0">
              <AllowedOriginsEditor
                origins={form.allowed_origins}
                onChange={(origins) => set("allowed_origins", origins)}
              />
            </TabsContent>

            {/* Theme */}
            <TabsContent value="theme" className="px-6 py-6 mt-0">
              <ThemeEditor theme={form.theme} onChange={(theme) => set("theme", theme)} />
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="px-6 py-6 mt-0">
              <SettingsEditor settings={form.settings} onChange={(settings) => set("settings", settings)} />
            </TabsContent>

            {/* Categories — own CRUD endpoints, only available once the widget has a numeric id */}
            {isEdit && widget && (
              <TabsContent value="categories" className="px-6 py-6 mt-0">
                <CategoriesEditor widgetId={widget.id} />
              </TabsContent>
            )}

            {/* Advanced */}
            <TabsContent value="advanced" className="px-6 py-6 space-y-5 mt-0">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Chat Context IDs
                </Label>
                <Input
                  value={contextIdsRaw}
                  onChange={(e) => setContextIdsRaw(e.target.value)}
                  placeholder="12, 13"
                  className="text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Comma-separated numeric IDs of context records. Leave empty to use account defaults.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  RAG Store IDs
                </Label>
                <Input
                  value={ragIdsRaw}
                  onChange={(e) => setRagIdsRaw(e.target.value)}
                  placeholder="4"
                  className="text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Comma-separated numeric IDs of knowledge base stores. Leave empty to use account defaults.
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  If both lists are empty, the widget uses the account&apos;s active contexts and stores.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
