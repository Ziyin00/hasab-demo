"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  ExternalLink,
  Loader2,
  RefreshCw,
  Save,
  Send,
  X,
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
import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import {
  useCreateTelegramBot,
  useRefreshTelegramWebhook,
  useSyncTelegramCommands,
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
import { botProfilePhotoUrl, isHttpsUrl, miniAppUrlError, timeAgo } from "../utils/format";
import { cn } from "@/lib/utils";
import { AccessEditor } from "./AccessEditor";
import { CommandsEditor } from "./CommandsEditor";

const MODES: { label: string; value: TelegramBotMode; hint: string }[] = [
  { label: "Chat", value: "chat", hint: "Native Telegram chat only" },
  { label: "Mini App", value: "mini_app", hint: "Prefer the Web App button" },
  { label: "Hybrid", value: "hybrid", hint: "Native chat + Mini App" },
];

const MAX_MINI_APP_BUTTON = 10;

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
  chat_context_ids: number[];
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
    chat_context_ids: [],
    rag_store_ids_raw: "",
    rate_limit_per_minute: 45,
    is_active: true,
    settings: structuredClone(DEFAULT_TELEGRAM_SETTINGS),
    profile_photo: null,
    remove_profile_photo: false,
    rotate_token: "",
  };
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
        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) max-h-72 overflow-y-auto">
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
          {/* Keep selected IDs that are no longer in the list visible */}
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
          Select contexts to inject for this bot, or leave empty for account defaults.
        </p>
      )}
    </div>
  );
}

function ModeSelector({
  value,
  onChange,
}: {
  value: TelegramBotMode;
  onChange: (mode: TelegramBotMode) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className={cn(
            "rounded-lg border px-3 py-3 text-left transition-colors",
            value === mode.value
              ? "border-primary bg-primary/8 ring-1 ring-primary/20"
              : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/30"
          )}
        >
          <p className="text-sm font-medium">{mode.label}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{mode.hint}</p>
        </button>
      ))}
    </div>
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

function ProfilePhotoField({
  preview,
  initials,
  onPick,
  onRemove,
  removing,
}: {
  preview: string | null;
  initials?: string;
  onPick: (file: File | null) => void;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [preview]);

  const showPhoto = Boolean(preview) && !failed;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <label
        className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border bg-muted/40 shadow-xs"
        title="Upload or take a photo"
      >
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview!}
            alt="Profile"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
            {initials?.slice(0, 2).toUpperCase() || <Camera className="h-5 w-5" />}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            onPick(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </label>
      {onRemove && showPhoto && !removing && (
        <button
          type="button"
          className="text-[11px] text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          Remove
        </button>
      )}
      {removing && !preview && (
        <p className="max-w-20 text-center text-[10px] leading-tight text-amber-700 dark:text-amber-400">
          Cleared on save
        </p>
      )}
    </div>
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
      chat_context_ids: bot.chat_context_ids ?? [],
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

  const displayPhoto = form.remove_profile_photo
    ? null
    : photoPreview ?? botProfilePhotoUrl(bot);

  const photoInitials = (form.name || bot?.name || bot?.bot_username || "B").replace(/^@/, "");
  const miniUrlError = miniAppUrlError(form.settings.mini_app.url ?? "");

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
      toast.error(miniAppUrlError(mini.url) ?? "Mini App URL must be HTTPS");
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
      name: form.name.trim() || undefined,
      mode: form.mode,
      welcome_message: form.welcome_message || null,
      about: form.about || null,
      default_language: form.default_language,
      chat_context_ids: form.chat_context_ids,
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
      chat_context_ids: form.chat_context_ids,
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
    if (!file.type.startsWith("image/")) {
      toast.error("Profile photo must be an image");
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
              ? "Update profile, commands, phone allowlist, Mini App, and features."
              : "Connect a BotFather token — name and username are pulled from Telegram automatically."}
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
        <div className="rounded-xl border bg-card">
          <Tabs defaultValue="general">
            <TabsList className="h-11 w-full justify-start gap-1 rounded-t-xl rounded-b-none border-b bg-transparent px-4">
              <TabsTrigger value="general" className="text-xs">
                General
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs">
                Features
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs">
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-0 space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <FieldLabel required>BotFather token</FieldLabel>
                <Input
                  value={form.bot_token}
                  onChange={(e) => set("bot_token", e.target.value)}
                  placeholder="1234567890:AA..."
                  className="font-mono text-sm"
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-[11px] text-muted-foreground">
                  From @BotFather → /newbot or /token. Stored masked — never shown in full again.
                </p>
              </div>

              <div className="flex items-start gap-4">
                <ProfilePhotoField preview={displayPhoto} initials={photoInitials} onPick={onPickPhoto} />
                <div className="min-w-0 max-w-sm flex-1 space-y-1.5">
                  <FieldLabel>Display name</FieldLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    maxLength={64}
                    className="text-sm"
                    placeholder="Pulled from BotFather if left empty"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Optional. Telegram name is used if you leave this blank.
                  </p>
                </div>
                <div className="ml-auto shrink-0 pt-5">
                  <ActiveToggle checked={form.is_active} onChange={(v) => set("is_active", v)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>About</FieldLabel>
                <Input
                  value={form.about}
                  onChange={(e) => set("about", e.target.value)}
                  placeholder="Official support bot for Acme customers"
                  maxLength={120}
                  className="text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  {form.about.length}/120 — Telegram short description shown in the bot profile.
                </p>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Welcome message</FieldLabel>
                <Textarea
                  value={form.welcome_message}
                  onChange={(e) => set("welcome_message", e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  maxLength={4000}
                  placeholder="Hi! Ask me anything about our products."
                />
                <p className="text-[11px] text-muted-foreground">
                  Sent when a visitor starts a conversation.
                </p>
              </div>

              <div className="space-y-2">
                <FieldLabel>Bot mode</FieldLabel>
                <ModeSelector value={form.mode} onChange={(mode) => set("mode", mode)} />
              </div>

              <div className="grid gap-4 sm:max-w-xs">
                <div className="space-y-1.5">
                  <FieldLabel>Default language</FieldLabel>
                  <LanguageSelect
                    value={form.default_language}
                    onChange={(v) => set("default_language", v)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-0 space-y-4 px-6 py-6">
              <p className="text-xs text-muted-foreground">
                Choose how visitors interact in Telegram. You can change these anytime after create.
              </p>
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Free-text chat</p>
                  <p className="text-xs text-muted-foreground">
                    When off, visitors are guided to the Mini App button instead of chatting inline.
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
                    Accept Telegram voice/audio, transcribe with ASR, then reply in chat.
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

            <TabsContent value="advanced" className="mt-0 space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <FieldLabel>Rate limit / minute</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={form.rate_limit_per_minute}
                  onChange={(e) => set("rate_limit_per_minute", Number(e.target.value))}
                  className="max-w-[8rem] text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Max messages per visitor per minute. Default is 45.
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
                  Phone allowlist, slash commands, Mini App URL, and webhook tools are available on
                  the edit page after the bot is created.
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
              <div className="flex items-start gap-4">
                <ProfilePhotoField
                  preview={displayPhoto}
                  initials={photoInitials}
                  onPick={onPickPhoto}
                  removing={form.remove_profile_photo}
                  onRemove={() => {
                    set("profile_photo", null);
                    setPhotoPreview(null);
                    set("remove_profile_photo", true);
                  }}
                />
                <div className="min-w-0 max-w-sm flex-1 space-y-1.5">
                  <FieldLabel>Display name</FieldLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    maxLength={64}
                    className="text-sm"
                    placeholder={bot!.name}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Synced to Telegram via setMyName. Username{" "}
                    <code className="rounded bg-muted px-1 font-mono">@{bot!.bot_username}</code> is
                    read-only.
                  </p>
                </div>
                <div className="ml-auto shrink-0 pt-5">
                  <ActiveToggle checked={form.is_active} onChange={(v) => set("is_active", v)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>About</FieldLabel>
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
                <FieldLabel>Welcome message</FieldLabel>
                <Textarea
                  value={form.welcome_message}
                  onChange={(e) => set("welcome_message", e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  maxLength={4000}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Bot mode</FieldLabel>
                <ModeSelector value={form.mode} onChange={(mode) => set("mode", mode)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FieldLabel>Default language</FieldLabel>
                  <LanguageSelect
                    value={form.default_language}
                    onChange={(v) => set("default_language", v)}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Rate limit / minute</FieldLabel>
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

            {/* Access */}
            <TabsContent value="access" className="mt-0 px-6 py-6">
              <AccessEditor
                botId={bot!.id}
                access={form.settings.access_control}
                onAccessCopyChange={(patch) =>
                  setSettings({
                    access_control: { ...form.settings.access_control, ...patch },
                  })
                }
                onBotUpdated={(updated) => {
                  setSettings({ access_control: mergeSettings(updated).access_control });
                }}
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
                <FieldLabel>Mini App URL (HTTPS)</FieldLabel>
                {miniUrlError && (
                  <p className="text-xs font-medium text-destructive">{miniUrlError}</p>
                )}
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
                  className={cn("font-mono text-sm", miniUrlError && "border-destructive")}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Button label</FieldLabel>
                <Input
                  value={form.settings.mini_app.button_text ?? ""}
                  onChange={(e) =>
                    setSettings({
                      mini_app: {
                        ...form.settings.mini_app,
                        button_text: e.target.value.slice(0, MAX_MINI_APP_BUTTON),
                      },
                    })
                  }
                  maxLength={MAX_MINI_APP_BUTTON}
                  placeholder="Open chat"
                  className="text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  {(form.settings.mini_app.button_text ?? "").length}/{MAX_MINI_APP_BUTTON} characters
                </p>
              </div>

              {/* <div className="space-y-2 rounded-xl border border-primary/15 bg-primary/3 px-4 py-3">
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
              </div> */}
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
                <FieldLabel>Rotate BotFather token</FieldLabel>
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
