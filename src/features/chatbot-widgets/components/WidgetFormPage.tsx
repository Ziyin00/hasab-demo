"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Loader2, Save, X } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasabApiKey } from "@/features/api-key/hooks/useHasabApiKey";
import { useContexts } from "@/features/context/hooks/useContexts";
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
import { ChannelLimitBanner } from "@/features/channel-limit/components/ChannelLimitBanner";
import { canCreateChannel, useChannelLimit } from "@/features/channel-limit/hooks/useChannelLimit";
import { prepareQuickPromptsForSave } from "../utils/quickPrompts";
import {
  mergeWidgetTheme,
  normalizeWidgetSettings,
  syncLauncherLabelFromTheme,
} from "../utils/normalizeSettings";
import { normalizeUiLanguageCode } from "../utils/languageCodes";

const POSITIONS: { label: string; value: WidgetPosition }[] = [
  { label: "Bottom Right", value: "bottom-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Top Right", value: "top-right" },
  { label: "Top Left", value: "top-left" },
];

const LANGS = [
  { value: "en", label: "English" },
  { value: "am", label: "Amharic" },
  { value: "om", label: "Oromo" },
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
  launcher: {
    type: "icon",
    label: "",
    icon_url: null,
    background_color: "#0f766e",
    text_color: "#ffffff",
  },
  header: { avatar_url: null, avatar_initials: "AF" },
  mic: {
    label: "",
    recording_label: "Stop",
    processing_label: "Wait",
    icon_url: null,
    recording_icon_url: null,
    background_color: "#475569",
    recording_background_color: "#dc2626",
    processing_background_color: "#d97706",
    text_color: "#ffffff",
  },
  send: { label: "Send", icon_url: null },
};

const DEFAULT_SETTINGS: ChatbotWidgetSettings = {
  title: "Hasab AI",
  subtitle: "Ready to help",
  launcher_label: "",
  input_placeholder: "Ask in your language...",
  show_language_selector: true,
  languages: [
    { code: "en", label: "English" },
    { code: "am", label: "Amharic" },
    { code: "om", label: "Oromo" },
  ],
  features: {
    audio_upload: false,
    tts: false,
    quick_prompts: true,
    language_selector: true,
  },
};

interface FormState extends CreateChatbotWidgetPayload {
  rag_store_ids_raw: string;
}

function emptyForm(): FormState {
  return {
    name: "",
    allowed_origins: [],
    welcome_message: "Hi, how can I help?",
    default_language: "en",
    position: "bottom-right",
    theme: { ...DEFAULT_THEME, launcher: { ...DEFAULT_THEME.launcher }, header: { ...DEFAULT_THEME.header }, mic: { ...DEFAULT_THEME.mic }, send: { ...DEFAULT_THEME.send } },
    settings: {
      ...DEFAULT_SETTINGS,
      languages: DEFAULT_SETTINGS.languages?.map((l) => ({ ...l })),
      features: { ...DEFAULT_SETTINGS.features },
    },
    chat_context_ids: [],
    rag_store_ids: [],
    rag_store_ids_raw: "",
    rate_limit_per_minute: 60,
    is_active: true,
  };
}

function parseIds(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
      {required ? <span className="text-destructive"> *</span> : null}
    </Label>
  );
}

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGS.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ActiveToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Active
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ChatContextIdsField({
  value,
  onChange,
}: {
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const { apiKey, isLoading: keyLoading } = useHasabApiKey();
  const { data: contexts, isLoading: contextsLoading } = useContexts(apiKey);
  const loading = keyLoading || contextsLoading;

  const byId = new Map((contexts ?? []).map((c) => [c.id, c]));
  const selected = new Set(value);

  const toggle = (id: number) => {
    if (selected.has(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const label =
    value.length === 0
      ? "Account defaults"
      : value.length === 1
        ? byId.get(value[0])?.name ?? `Context #${value[0]}`
        : `${value.length} contexts selected`;

  return (
    <div className="space-y-1.5">
      <FieldLabel>Chat contexts</FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-between font-normal"
            disabled={loading}
          >
            <span className="truncate text-left">
              {loading ? "Loading contexts…" : label}
            </span>
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-(--radix-dropdown-menu-trigger-width) max-h-72 overflow-y-auto"
        >
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Leave empty to use account defaults
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(contexts ?? []).length === 0 && !loading ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              No contexts found. Create some under Contexts first.
            </p>
          ) : (
            (contexts ?? []).map((ctx) => (
              <DropdownMenuCheckboxItem
                key={ctx.id}
                checked={selected.has(ctx.id)}
                onCheckedChange={() => toggle(ctx.id)}
                onSelect={(e) => e.preventDefault()}
                className="gap-2"
              >
                <span className="min-w-0 flex-1 truncate">{ctx.name}</span>
                {!ctx.is_active ? (
                  <span className="text-[10px] text-muted-foreground">inactive</span>
                ) : null}
              </DropdownMenuCheckboxItem>
            ))
          )}
          {value
            .filter((id) => !byId.has(id))
            .map((id) => (
              <DropdownMenuCheckboxItem
                key={`missing-${id}`}
                checked
                onCheckedChange={() => toggle(id)}
                onSelect={(e) => e.preventDefault()}
              >
                Context #{id}
                <span className="ml-2 text-[10px] text-muted-foreground">missing</span>
              </DropdownMenuCheckboxItem>
            ))}
          {(contexts ?? []).length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <div className="flex items-center gap-1 px-1 py-0.5">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                  disabled={(contexts ?? []).every((c) => selected.has(c.id))}
                  onClick={() =>
                    onChange([
                      ...new Set([...(contexts ?? []).map((c) => c.id), ...value]),
                    ])
                  }
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                  disabled={value.length === 0}
                  onClick={() => onChange([])}
                >
                  Clear selection
                </button>
              </div>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1 pr-1">
              <span className="max-w-40 truncate">
                {byId.get(id)?.name ?? `#${id}`}
              </span>
              <button
                type="button"
                aria-label={`Remove ${byId.get(id)?.name ?? id}`}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => toggle(id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Select contexts to inject for this widget, or leave empty for account defaults.
        </p>
      )}
    </div>
  );
}

interface WidgetFormPageProps {
  widget?: ChatbotWidget | null;
  loading?: boolean;
}

export function WidgetFormPage({ widget, loading }: WidgetFormPageProps) {
  const router = useRouter();
  const isEdit = !!widget;
  const { data: channelLimit } = useChannelLimit();
  const canCreate = canCreateChannel(channelLimit);

  const { mutate: create, isPending: creating } = useCreateChatbotWidget();
  const { mutate: update, isPending: updating } = useUpdateChatbotWidget();
  const isPending = creating || updating;

  const [form, setForm] = useState<FormState>(emptyForm);

  const widgetId = widget?.id;
  useEffect(() => {
    if (!widget) return;
    const { id, widget_id, snippet, ...rest } = widget;
    void id;
    void widget_id;
    void snippet;
    const payload = rest as CreateChatbotWidgetPayload;
    setForm({
      ...payload,
      theme: mergeWidgetTheme(DEFAULT_THEME, payload.theme),
      settings: normalizeWidgetSettings({
        ...payload.settings,
        // Preserve omit vs stored list — do not seed `{}` (that would hide built-ins in the editor).
        quick_prompts: prepareQuickPromptsForSave(
          payload.settings?.quick_prompts,
          payload.settings?.languages
        ),
      }),
      chat_context_ids: widget.chat_context_ids ?? [],
      rag_store_ids_raw: (widget.rag_store_ids ?? []).join(", "),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate by id only
  }, [widgetId]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.name.trim()) return;

    const payload: CreateChatbotWidgetPayload = {
      name: form.name.trim(),
      allowed_origins: form.allowed_origins,
      welcome_message: form.welcome_message,
      default_language: normalizeUiLanguageCode(form.default_language),
      position: form.position,
      theme: form.theme,
      chat_context_ids: form.chat_context_ids,
      rag_store_ids: parseIds(form.rag_store_ids_raw),
      rate_limit_per_minute: form.rate_limit_per_minute,
      is_active: form.is_active,
      settings: normalizeWidgetSettings(
        syncLauncherLabelFromTheme(
          {
            ...form.settings,
            quick_prompts: prepareQuickPromptsForSave(
              form.settings?.quick_prompts,
              form.settings?.languages
            ),
          },
          form.theme
        )
      ),
    };

    if (isEdit && widget) {
      update(
        { id: widget.id, payload },
        { onSuccess: () => router.push("/dashboard/widgets") }
      );
    } else {
      create(payload, { onSuccess: () => router.push("/dashboard/widgets") });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-1 -mt-16 shrink-0"
        onClick={() => router.push("/dashboard/widgets")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="-mt-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">
            {isEdit ? `Edit: ${widget!.name}` : "New Widget"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isEdit
              ? "Update origins, theme, settings, categories, and knowledge contexts."
              : "Configure your chatbot widget. You'll get an embed snippet after create."}
          </p>
          {isEdit && widget?.widget_id && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {widget.widget_id}
              </code>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/widgets")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="gap-2"
            disabled={isPending || !form.name.trim() || (!isEdit && !canCreate)}
            onClick={handleSave}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? "Saving…" : isEdit ? "Save Widget" : "Create Widget"}
          </Button>
        </div>
      </div>

      {!isEdit ? <ChannelLimitBanner /> : null}

      {!isEdit ? (
        <div className="rounded-xl border bg-card">
          <Tabs defaultValue="general">
            <TabsList className="h-11 w-full justify-start gap-1 rounded-t-xl rounded-b-none border-b bg-transparent px-4">
              <TabsTrigger value="general" className="text-xs">
                General
              </TabsTrigger>
              <TabsTrigger value="origins" className="text-xs">
                Origins
              </TabsTrigger>
              <TabsTrigger value="theme" className="text-xs">
                Theme
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                Settings
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs">
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-0 space-y-5 px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="min-w-0 max-w-sm flex-1 space-y-1.5">
                  <FieldLabel required>Widget name</FieldLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Customer website support"
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Internal name — shown in the portal only.
                  </p>
                </div>
                <div className="ml-auto shrink-0 pt-5">
                  <ActiveToggle
                    checked={form.is_active}
                    onChange={(v) => set("is_active", v)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Welcome message</FieldLabel>
                <Textarea
                  value={form.welcome_message}
                  onChange={(e) => set("welcome_message", e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  placeholder="Hi, how can I help?"
                />
                <p className="text-[11px] text-muted-foreground">
                  Shown when a visitor opens the chat for the first time.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FieldLabel>Position</FieldLabel>
                  <Select
                    value={form.position}
                    onValueChange={(v) => set("position", v as WidgetPosition)}
                  >
                    <SelectTrigger className="h-9">
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
                  <FieldLabel>Default language</FieldLabel>
                  <LanguageSelect
                    value={normalizeUiLanguageCode(form.default_language)}
                    onChange={(v) => set("default_language", v)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="origins" className="mt-0 px-6 py-6">
              <AllowedOriginsEditor
                origins={form.allowed_origins}
                onChange={(origins) => set("allowed_origins", origins)}
              />
            </TabsContent>

            <TabsContent value="theme" className="mt-0 px-6 py-6">
              <ThemeEditor
                theme={form.theme}
                onChange={(theme) => set("theme", theme)}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-0 px-6 py-6">
              <SettingsEditor
                settings={form.settings}
                onChange={(settings) => set("settings", settings)}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-0 space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <FieldLabel>Rate limit / minute</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={form.rate_limit_per_minute}
                  onChange={(e) =>
                    set("rate_limit_per_minute", Number(e.target.value))
                  }
                  className="max-w-32 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Max requests per visitor per minute. Default is 60.
                </p>
              </div>

              <ChatContextIdsField
                value={form.chat_context_ids}
                onChange={(ids) => set("chat_context_ids", ids)}
              />

              <div className="space-y-1.5">
                <FieldLabel>RAG store IDs</FieldLabel>
                <Input
                  value={form.rag_store_ids_raw}
                  onChange={(e) => set("rag_store_ids_raw", e.target.value)}
                  placeholder="4"
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Knowledge base stores for retrieval. Leave empty for account defaults.
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Categories are available on the edit page after the widget is created.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Tabs defaultValue="general">
            <TabsList className="h-11 w-full justify-start gap-1 rounded-t-xl rounded-b-none border-b bg-transparent px-4">
              <TabsTrigger value="general" className="text-xs">
                General
              </TabsTrigger>
              <TabsTrigger value="origins" className="text-xs">
                Origins
              </TabsTrigger>
              <TabsTrigger value="theme" className="text-xs">
                Theme
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                Settings
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs">
                Categories
              </TabsTrigger>
              <TabsTrigger value="contexts" className="text-xs">
                Contexts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-0 space-y-5 px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="min-w-0 max-w-sm flex-1 space-y-1.5">
                  <FieldLabel required>Widget name</FieldLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder={widget!.name}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Internal name — shown in the portal only. Widget ID{" "}
                    <code className="rounded bg-muted px-1 font-mono">
                      {widget!.widget_id}
                    </code>{" "}
                    is read-only.
                  </p>
                </div>
                <div className="ml-auto shrink-0 pt-5">
                  <ActiveToggle
                    checked={form.is_active}
                    onChange={(v) => set("is_active", v)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Welcome message</FieldLabel>
                <Textarea
                  value={form.welcome_message}
                  onChange={(e) => set("welcome_message", e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FieldLabel>Position</FieldLabel>
                  <Select
                    value={form.position}
                    onValueChange={(v) => set("position", v as WidgetPosition)}
                  >
                    <SelectTrigger className="h-9">
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
                  <FieldLabel>Default language</FieldLabel>
                  <LanguageSelect
                    value={normalizeUiLanguageCode(form.default_language)}
                    onChange={(v) => set("default_language", v)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:max-w-xs">
                <div className="space-y-1.5">
                  <FieldLabel>Rate limit / minute</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    value={form.rate_limit_per_minute}
                    onChange={(e) =>
                      set("rate_limit_per_minute", Number(e.target.value))
                    }
                    className="text-sm"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="origins" className="mt-0 px-6 py-6">
              <AllowedOriginsEditor
                origins={form.allowed_origins}
                onChange={(origins) => set("allowed_origins", origins)}
              />
            </TabsContent>

            <TabsContent value="theme" className="mt-0 px-6 py-6">
              <ThemeEditor
                theme={form.theme}
                onChange={(theme) => set("theme", theme)}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-0 px-6 py-6">
              <SettingsEditor
                settings={form.settings}
                onChange={(settings) => set("settings", settings)}
              />
            </TabsContent>

            <TabsContent value="categories" className="mt-0 px-6 py-6">
              <CategoriesEditor widgetId={widget!.id} />
            </TabsContent>

            <TabsContent value="contexts" className="mt-0 space-y-5 px-6 py-6">
              <ChatContextIdsField
                value={form.chat_context_ids}
                onChange={(ids) => set("chat_context_ids", ids)}
              />
              <div className="space-y-1.5">
                <FieldLabel>RAG store IDs</FieldLabel>
                <Input
                  value={form.rag_store_ids_raw}
                  onChange={(e) => set("rag_store_ids_raw", e.target.value)}
                  placeholder="4"
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Knowledge base stores for retrieval. Leave empty for account defaults.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
