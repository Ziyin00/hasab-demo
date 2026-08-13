"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Loader2,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import {
  useCreateTelegramBot,
  useRefreshTelegramWebhook,
  useSyncTelegramCommands,
  useUpdateTelegramAccess,
  useUpdateTelegramBot,
} from "../hooks/useTelegramBots";
import type {
  CreateTelegramBotPayload,
  TelegramBot,
  TelegramBotMode,
  TelegramBotSettings,
  UpdateTelegramBotPayload,
} from "../types/telegram-bot.types";
import { DEFAULT_TELEGRAM_SETTINGS } from "../types/telegram-bot.types";
import { isHttpsUrl, timeAgo } from "../utils/format";
import { AccessEditor } from "./AccessEditor";
import { CommandsEditor } from "./CommandsEditor";

const MODES: { label: string; value: TelegramBotMode; hint: string }[] = [
  { label: "Chat", value: "chat", hint: "Native Telegram chat only" },
  { label: "Mini App", value: "mini_app", hint: "Prefer the Web App button" },
  { label: "Hybrid", value: "hybrid", hint: "Native chat + Mini App" },
];

const LANGS = [
  { value: "en", label: "English" },
  { value: "am", label: "Amharic" },
  { value: "om", label: "Oromo" },
  { value: "ti", label: "Tigrinya" },
];

interface FormState {
  bot_token: string;
  name: string;
  about: string;
  mode: TelegramBotMode;
  welcome_message: string;
  default_language: string;
  chat_context_ids_raw: string;
  rag_store_ids_raw: string;
  rate_limit_per_minute: number;
  is_active: boolean;
  settings: TelegramBotSettings;
  profile_photo: File | null;
  remove_profile_photo: boolean;
  rotate_token: string;
}

function emptyForm(): FormState {
  return {
    bot_token: "",
    name: "",
    about: "",
    mode: "hybrid",
    welcome_message: "Hi! Ask me anything.",
    default_language: "en",
    chat_context_ids_raw: "",
    rag_store_ids_raw: "",
    rate_limit_per_minute: 45,
    is_active: true,
    settings: structuredClone(DEFAULT_TELEGRAM_SETTINGS),
    profile_photo: null,
    remove_profile_photo: false,
    rotate_token: "",
  };
}

function parseIds(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

function mergeSettings(bot: TelegramBot): TelegramBotSettings {
  const s = bot.settings ?? {};
  return {
    commands: s.commands ?? DEFAULT_TELEGRAM_SETTINGS.commands,
    access_control: {
      ...DEFAULT_TELEGRAM_SETTINGS.access_control,
      ...(s.access_control ?? {}),
      allowed_phones: s.access_control?.allowed_phones ?? [],
      allowed_count: s.access_control?.allowed_count ?? 0,
    },
    mini_app: {
      ...DEFAULT_TELEGRAM_SETTINGS.mini_app,
      ...(s.mini_app ?? {}),
    },
    features: {
      ...DEFAULT_TELEGRAM_SETTINGS.features,
      ...(s.features ?? {}),
    },
  };
}

interface TelegramBotFormPageProps {
  bot?: TelegramBot | null;
  loading?: boolean;
}

export function TelegramBotFormPage({ bot, loading }: TelegramBotFormPageProps) {
  const router = useRouter();
  const isEdit = !!bot;

  const { mutate: create, isPending: creating } = useCreateTelegramBot();
  const { mutate: update, isPending: updating } = useUpdateTelegramBot();
  const { mutate: syncCommands, isPending: syncing } = useSyncTelegramCommands();
  const { mutate: refreshWebhook, isPending: refreshing } = useRefreshTelegramWebhook();
  const { mutate: updateAccess, isPending: savingAccess } = useUpdateTelegramAccess();
  const { data: widgets } = useChatbotWidgets();

  const isPending = creating || updating;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!bot) return;
    setForm({
      bot_token: "",
      name: bot.name ?? "",
      about: bot.about ?? "",
      mode: bot.mode ?? "hybrid",
      welcome_message: bot.welcome_message ?? "",
      default_language: bot.default_language ?? "en",
      chat_context_ids_raw: (bot.chat_context_ids ?? []).join(", "),
      rag_store_ids_raw: (bot.rag_store_ids ?? []).join(", "),
      rate_limit_per_minute: bot.rate_limit_per_minute ?? 45,
      is_active: bot.is_active,
      settings: mergeSettings(bot),
      profile_photo: null,
      remove_profile_photo: false,
      rotate_token: "",
    });
  }, [bot]);

  useEffect(() => {
    if (!form.profile_photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(form.profile_photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.profile_photo]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const setSettings = (patch: Partial<TelegramBotSettings>) =>
    setForm((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));

  const validateMiniApp = (): boolean => {
    const mini = form.settings.mini_app;
    if (!mini.enabled) return true;
    if (!mini.url?.trim()) {
      toast.error("Mini App URL is required when enabled");
      return false;
    }
    if (!isHttpsUrl(mini.url.trim())) {
      toast.error("Mini App URL must be HTTPS");
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!form.bot_token.trim()) {
      toast.error("BotFather token is required");
      return;
    }
    if (!validateMiniApp()) return;

    const payload: CreateTelegramBotPayload = {
      bot_token: form.bot_token.trim(),
      mode: form.mode,
      welcome_message: form.welcome_message || null,
      about: form.about || null,
      default_language: form.default_language,
      chat_context_ids: parseIds(form.chat_context_ids_raw),
      rag_store_ids: parseIds(form.rag_store_ids_raw),
      settings: {
        commands: form.settings.commands,
        mini_app: form.settings.mini_app,
        features: form.settings.features,
        access_control: {
          enabled: form.settings.access_control.enabled,
          mode: "phone_allowlist",
          prompt_message: form.settings.access_control.prompt_message,
          denied_message: form.settings.access_control.denied_message,
          share_button_text: form.settings.access_control.share_button_text,
        },
      },
      rate_limit_per_minute: form.rate_limit_per_minute,
      is_active: form.is_active,
      profile_photo: form.profile_photo,
    };

    create(payload, {
      onSuccess: (created) => router.push(`/dashboard/telegram-bots/${created.id}/edit`),
    });
  };

  const handleUpdate = (extra?: Partial<UpdateTelegramBotPayload>) => {
    if (!bot) return;
    if (!validateMiniApp()) return;

    const payload: UpdateTelegramBotPayload = {
      name: form.name.trim() || undefined,
      about: form.about,
      mode: form.mode,
      welcome_message: form.welcome_message || null,
      default_language: form.default_language,
      chat_context_ids: parseIds(form.chat_context_ids_raw),
      rag_store_ids: parseIds(form.rag_store_ids_raw),
      settings: {
        commands: form.settings.commands,
        mini_app: form.settings.mini_app,
        features: form.settings.features,
        access_control: {
          enabled: form.settings.access_control.enabled,
          mode: form.settings.access_control.mode || "phone_allowlist",
          prompt_message: form.settings.access_control.prompt_message,
          denied_message: form.settings.access_control.denied_message,
          share_button_text: form.settings.access_control.share_button_text,
        },
      },
      rate_limit_per_minute: form.rate_limit_per_minute,
      is_active: form.is_active,
      profile_photo: form.profile_photo,
      remove_profile_photo: form.remove_profile_photo || undefined,
      ...(form.rotate_token.trim() ? { bot_token: form.rotate_token.trim() } : {}),
      ...extra,
    };

    update(
      { id: bot.id, payload },
      {
        onSuccess: () => {
          set("profile_photo", null);
          set("remove_profile_photo", false);
          set("rotate_token", "");
        },
      }
    );
  };

  const onPickPhoto = (file: File | null) => {
    if (!file) {
      set("profile_photo", null);
      return;
    }
    if (!file.type.includes("jpeg") && !file.name.toLowerCase().endsWith(".jpg")) {
      toast.error("Profile photo must be a JPG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photo must be under 5MB");
      return;
    }
    set("remove_profile_photo", false);
    set("profile_photo", file);
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
        onClick={() => router.push("/dashboard/telegram-bots")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="-mt-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">
            {isEdit ? `Edit: ${bot!.name}` : "New Telegram Bot"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isEdit
              ? "Update profile, commands, ACL, Mini App, and features."
              : "Paste a BotFather token. Name and username come from Telegram."}
          </p>
          {isEdit && bot?.bot_username && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">@{bot.bot_username}</code>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{bot.public_id}</code>
              {bot.telegram_url && (
                <a
                  href={bot.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Open in Telegram <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/telegram-bots")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="gap-2"
            disabled={isPending || (isEdit ? false : !form.bot_token.trim())}
            onClick={() => (isEdit ? handleUpdate() : handleCreate())}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPending ? "Saving…" : isEdit ? "Save Bot" : "Create Bot"}
          </Button>
        </div>
      </div>

      {!isEdit ? (
        <div className="space-y-5 rounded-xl border bg-card px-6 py-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              BotFather token <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.bot_token}
              onChange={(e) => set("bot_token", e.target.value)}
              placeholder="123456:AA..."
              className="font-mono text-sm"
              autoComplete="off"
            />
            <p className="text-[11px] text-muted-foreground">
              From @BotFather → /newbot or /token. Never shown again after create (only masked).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About (optional)
            </Label>
            <Input
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Official support bot"
              maxLength={120}
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">{form.about.length}/120</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mode
              </Label>
              <Select
                value={form.mode}
                onValueChange={(v) => set("mode", v as TelegramBotMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default language
              </Label>
              <Select
                value={form.default_language}
                onValueChange={(v) => set("default_language", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Welcome message
            </Label>
            <Textarea
              value={form.welcome_message}
              onChange={(e) => set("welcome_message", e.target.value)}
              rows={3}
              className="resize-none text-sm"
              maxLength={4000}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Profile photo (JPG, optional)
            </Label>
            <Input
              type="file"
              accept="image/jpeg,.jpg"
              onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Preview"
                className="mt-2 h-16 w-16 rounded-full object-cover border"
              />
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive bots reject Telegram webhooks.</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Tabs defaultValue="general">
            <TabsList className="h-11 w-full justify-start gap-1 rounded-t-xl rounded-b-none border-b bg-transparent px-4">
              <TabsTrigger value="general" className="text-xs">
                General
              </TabsTrigger>
              <TabsTrigger value="commands" className="text-xs">
                Commands
              </TabsTrigger>
              <TabsTrigger value="contexts" className="text-xs">
                Contexts
              </TabsTrigger>
              <TabsTrigger value="access" className="text-xs">
                Access
              </TabsTrigger>
              <TabsTrigger value="mini-app" className="text-xs">
                Mini App
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs">
                Features
              </TabsTrigger>
              <TabsTrigger value="status" className="text-xs">
                Status
              </TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="mt-0 space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Display name
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={64}
                  className="text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Synced to Telegram via setMyName. Username{" "}
                  <code className="rounded bg-muted px-1 font-mono">@{bot!.bot_username}</code> is
                  read-only.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  About
                </Label>
                <Input
                  value={form.about}
                  onChange={(e) => set("about", e.target.value)}
                  maxLength={120}
                  className="text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  {form.about.length}/120 — Telegram short description. Clear to remove.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Welcome message
                </Label>
                <Textarea
                  value={form.welcome_message}
                  onChange={(e) => set("welcome_message", e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  maxLength={4000}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mode
                  </Label>
                  <Select
                    value={form.mode}
                    onValueChange={(v) => set("mode", v as TelegramBotMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Language
                  </Label>
                  <Select
                    value={form.default_language}
                    onValueChange={(v) => set("default_language", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Rate limit / min
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    value={form.rate_limit_per_minute}
                    onChange={(e) => set("rate_limit_per_minute", Number(e.target.value))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Profile photo</p>
                    <p className="text-xs text-muted-foreground">JPG only, max 5MB.</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                      <ImagePlus className="h-3.5 w-3.5" />
                      Replace
                      <input
                        type="file"
                        accept="image/jpeg,.jpg"
                        className="hidden"
                        onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => {
                        set("profile_photo", null);
                        set("remove_profile_photo", true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
                {photoPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="New photo"
                    className="h-14 w-14 rounded-full border object-cover"
                  />
                )}
                {form.remove_profile_photo && !photoPreview && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Avatar will be cleared on save.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive bots reject incoming webhooks.
                  </p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
              </div>
            </TabsContent>

            {/* Commands */}
            <TabsContent value="commands" className="mt-0 space-y-4 px-6 py-6">
              <CommandsEditor
                commands={form.settings.commands}
                onChange={(commands) => setSettings({ commands })}
              />
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={updating || syncing}
                  onClick={() => handleUpdate({ sync_commands: true })}
                >
                  {(updating || syncing) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save & sync to Telegram
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  disabled={syncing}
                  onClick={() => syncCommands(bot!.id)}
                >
                  {syncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Sync only
                </Button>
              </div>
            </TabsContent>

            {/* Contexts */}
            <TabsContent value="contexts" className="mt-0 space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Chat Context IDs
                </Label>
                <Input
                  value={form.chat_context_ids_raw}
                  onChange={(e) => set("chat_context_ids_raw", e.target.value)}
                  placeholder="12, 13"
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Same semantics as widgets. Leave empty for account defaults.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  RAG Store IDs
                </Label>
                <Input
                  value={form.rag_store_ids_raw}
                  onChange={(e) => set("rag_store_ids_raw", e.target.value)}
                  placeholder="4"
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            {/* Access */}
            <TabsContent value="access" className="mt-0 px-6 py-6">
              <AccessEditor
                access={form.settings.access_control}
                saving={savingAccess}
                onAccessCopyChange={(patch) =>
                  setSettings({
                    access_control: { ...form.settings.access_control, ...patch },
                  })
                }
                onSaveAccess={(payload) =>
                  updateAccess(
                    { id: bot!.id, payload },
                    {
                      onSuccess: (updated) => {
                        setSettings({ access_control: mergeSettings(updated).access_control });
                      },
                    }
                  )
                }
              />
            </TabsContent>

            {/* Mini App */}
            <TabsContent value="mini-app" className="mt-0 space-y-5 px-6 py-6">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Enable Mini App</p>
                  <p className="text-xs text-muted-foreground">
                    Sets chat menu button to your HTTPS Web App URL when mode is mini_app or hybrid.
                  </p>
                </div>
                <Switch
                  checked={form.settings.mini_app.enabled}
                  onCheckedChange={(v) =>
                    setSettings({
                      mini_app: { ...form.settings.mini_app, enabled: v },
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mini App URL (HTTPS)
                </Label>
                <Input
                  value={form.settings.mini_app.url ?? ""}
                  onChange={(e) =>
                    setSettings({
                      mini_app: {
                        ...form.settings.mini_app,
                        url: e.target.value || null,
                      },
                    })
                  }
                  placeholder="https://customer.com/telegram-app"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Button label
                </Label>
                <Input
                  value={form.settings.mini_app.button_text ?? ""}
                  onChange={(e) =>
                    setSettings({
                      mini_app: {
                        ...form.settings.mini_app,
                        button_text: e.target.value,
                      },
                    })
                  }
                  placeholder="Open chat"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-primary/15 bg-primary/3 px-4 py-3">
                <p className="text-xs font-semibold">Mini App bind checklist</p>
                <ul className="list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
                  <li>
                    Host a page that embeds a CDN chatbot widget owned by the same account.
                  </li>
                  <li>
                    Add that page&apos;s origin to the widget&apos;s{" "}
                    <code className="rounded bg-muted px-1 font-mono">allowed_origins</code>.
                  </li>
                  <li>
                    Before widget session:{" "}
                    <code className="rounded bg-muted px-1 font-mono">
                      POST /api/telegram/bots/{bot!.public_id}/mini-app/session
                    </code>{" "}
                    with Telegram <code className="rounded bg-muted px-1 font-mono">initData</code>{" "}
                    + <code className="rounded bg-muted px-1 font-mono">widget_id</code>.
                  </li>
                </ul>
                {(widgets?.length ?? 0) > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-medium text-foreground">Your widgets</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {widgets!.slice(0, 6).map((w) => (
                        <code
                          key={w.id}
                          className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]"
                        >
                          {w.widget_id}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Features */}
            <TabsContent value="features" className="mt-0 space-y-4 px-6 py-6">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Free-text chat</p>
                  <p className="text-xs text-muted-foreground">
                    When off, visitors are pushed to the Mini App button instead of chatting in
                    Telegram.
                  </p>
                </div>
                <Switch
                  checked={form.settings.features.chat}
                  onCheckedChange={(v) =>
                    setSettings({
                      features: { ...form.settings.features, chat: v },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Voice notes</p>
                  <p className="text-xs text-muted-foreground">
                    Accept Telegram voice/audio → ASR (billed) → transcript → chat.
                  </p>
                </div>
                <Switch
                  checked={form.settings.features.voice}
                  onCheckedChange={(v) =>
                    setSettings({
                      features: { ...form.settings.features, voice: v },
                    })
                  }
                />
              </div>
            </TabsContent>

            {/* Status */}
            <TabsContent value="status" className="mt-0 space-y-5 px-6 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/10 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Last webhook
                  </p>
                  <p className="mt-1 text-sm font-medium">{timeAgo(bot!.last_webhook_at)}</p>
                  {bot!.last_webhook_at && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(bot!.last_webhook_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border bg-muted/10 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Token (masked)
                  </p>
                  <p className="mt-1 font-mono text-sm">{bot!.bot_token_masked}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rotate BotFather token
                </Label>
                <Input
                  value={form.rotate_token}
                  onChange={(e) => set("rotate_token", e.target.value)}
                  placeholder="Paste new token to rotate on save"
                  className="font-mono text-sm"
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={refreshing}
                  onClick={() => refreshWebhook(bot!.id)}
                >
                  {refreshing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Refresh webhook
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  disabled={updating}
                  onClick={() => handleUpdate({ refresh_webhook: true })}
                >
                  Save + refresh webhook
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
