"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Send, X, RotateCcw, Bot, Loader2,
  MessageSquareDot, Mic, Play, Pause, ChevronLeft,
} from "lucide-react";
import { useWidgetConfig } from "@/features/widget/hooks/useWidget";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { buildClientMetadata } from "@/lib/client-metadata";
import type {
  ChatbotWidgetTheme,
  ChatbotWidgetSettings,
  WidgetPosition,
} from "@/features/chatbot-widgets/types/chatbot-widget.types";
import {
  resolveQuickPromptsForLang,
} from "@/features/chatbot-widgets/utils/quickPrompts";
import {
  normalizeUiLanguageCode,
  resolveLanguageInstruction,
  // shouldRequestTts,
  toSttLanguageCode,
  // isTtsLanguage,
} from "@/features/chatbot-widgets/utils/languageCodes";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  isVoice?: boolean;
  // TTS integration (disabled):
  // /** Assistant Tigist audio — only set when the visitor had Amharic selected at send time. */
  // playTts?: boolean;
  // replyLang?: string;
  audioUrl?: string;
  ts: Date;
}

type MicState = "idle" | "recording" | "paused" | "processing";
type Lang = "en" | "am" | "om";

// ─── Language strings (mirrors fayda-demo.html) ───────────────────────────────

const LANG_STRINGS: Record<Lang, {
  label: string;
  placeholder: string;
  online: string;
  subtitle: string;
  thinking: string;
  welcomeTitle: string;
  welcomeBody: string;
  today: string;
  prompts: string[];
  /** Stored server-side as a context — never prepended to messages */
  contextInstruction: string;
  sttLang: string;
}> = {
  en: {
    label: "English",
    placeholder: "Type your message...",
    online: "Online",
    subtitle: "Ready to help",
    thinking: "Thinking",
    welcomeTitle: "Welcome",
    welcomeBody: "Pick a question above, type, or tap the mic to speak.",
    today: "Today",
    prompts: ["What can you help me with?", "Tell me about your features", "How do I get started?"],
    contextInstruction: "CRITICAL: You MUST respond ONLY in English. Do not use any other language.",
    sttLang: "eng",
  },
  am: {
    label: "አማርኛ",
    placeholder: "መልዕክትዎን ይፃፉ...",
    online: "ኦንላይን",
    subtitle: "ለመርዳት ዝግጁ",
    thinking: "እያሰበ ነው",
    welcomeTitle: "እንኳን ወደ ቻቱ በደህና መጡ",
    welcomeBody: "ጥያቄ ይምረጡ፣ ይፃፉ ወይም ሚክሮፎኑን ይጫኑ።",
    today: "ዛሬ",
    prompts: ["ምን ሊረዱኝ ይችላሉ?", "ስለ ፕሮዳክቱ ይናገሩ", "እንዴት እጀምር?"],
    contextInstruction: "CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). Do not use English or any other language.",
    sttLang: "amh",
  },
  om: {
    label: "Afaan Oromoo",
    placeholder: "Ergaa kee barreessi...",
    online: "Online",
    subtitle: "Gargaaruuf qophaa'eera",
    thinking: "Yaadaa jira",
    welcomeTitle: "Baga nagaan dhufte",
    welcomeBody: "Gaaffii filadhu, barreessi yookaan miikrofoona tuqi.",
    today: "Har'a",
    prompts: ["Maal na gargaaruu dandeessa?", "Waa'ee tajaajila dubbadhu", "Akkami jalqabuu?"],
    contextInstruction: "CRITICAL: You MUST respond ONLY in Afaan Oromoo. Do not use English, Amharic, or any other language.",
    sttLang: "orm",
  },
};

const LANG_OPTIONS: { value: Lang; native: string }[] = [
  { value: "am", native: "አማርኛ" },
  { value: "en", native: "English" },
  { value: "om", native: "Afaan Oromoo" },
];

// Widget settings.languages may use ISO 639-3 aliases ("amh", "orm"); normalize before use.
function toLangKey(code: string): Lang {
  return normalizeUiLanguageCode(code);
}

// ─── Audio utilities (mirrors fayda-demo.html) ───────────────────────────────

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const len = buffer.length;
  const ch = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const ab = new ArrayBuffer(44 + len * ch * 2);
  const view = new DataView(ab);

  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  str(0, "RIFF");
  view.setUint32(4, 36 + len * ch * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, ch, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * ch * 2, true);
  view.setUint16(32, ch * 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, len * ch * 2, true);

  let offset = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return ab;
}

async function toWav(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new Ctx();
        const decoded = await ctx.decodeAudioData(
          e.target!.result as ArrayBuffer
        );
        resolve(new Blob([audioBufferToWav(decoded)], { type: "audio/wav" }));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

function bestMime(): string {
  const candidates = [
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "audio/webm";
}

function fmtSecs(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

// ─── Markdown renderer ───────────────────────────────────────────────────────

function renderMarkdown(raw: string): string {
  const lines = raw.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const esc = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (esc.match(/^### /)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3 style="font-weight:600;margin:8px 0 4px">${esc.slice(4)}</h3>`;
    } else if (esc.match(/^## /)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2 style="font-weight:600;margin:8px 0 4px">${esc.slice(3)}</h2>`;
    } else if (esc.match(/^[\*\-] /)) {
      if (!inList) { html += '<ul style="margin:6px 0;padding-left:18px">'; inList = true; }
      const item = esc
        .slice(2)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
      html += `<li style="margin:3px 0">${item}</li>`;
    } else {
      if (inList && esc.trim()) { html += "</ul>"; inList = false; }
      if (esc.trim()) {
        const p = esc
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>");
        html += `${p}<br>`;
      } else {
        html += "<br>";
      }
    }
  }
  if (inList) html += "</ul>";
  return html;
}

// ─── Voice message player ─────────────────────────────────────────────────────

function VoiceMessage({
  audioUrl,
  tone = "user",
}: {
  audioUrl: string;
  /** User bubbles sit on saturated color (light controls); assistant on light surfaces. */
  tone?: "user" | "assistant";
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isUser = tone === "user";

  // Stable decorative waveform bars seeded from the URL
  const bars = useMemo(() => {
    const seed = audioUrl.length;
    return Array.from({ length: 30 }, (_, i) => {
      const x = Math.sin(i * 0.7 + seed) * 0.5 + 0.5;
      return 0.15 + x * 0.85;
    });
  }, [audioUrl]);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };
    audio.onended = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
    return () => {
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
            isUser
              ? "bg-white/20 hover:bg-white/30"
              : "bg-black/8 hover:bg-black/12 dark:bg-white/15 dark:hover:bg-white/25"
          )}
        >
          {playing
            ? <Pause className={cn("w-3.5 h-3.5", isUser ? "text-white" : "text-foreground")} />
            : <Play className={cn("w-3.5 h-3.5 translate-x-px", isUser ? "text-white" : "text-foreground")} />}
        </button>

        <div className="flex items-center gap-px flex-1 h-7">
          {bars.map((h, i) => (
            <div
              key={i}
              className="rounded-full w-1 shrink-0 transition-colors duration-100"
              style={{
                height: `${h * 100}%`,
                background: i / bars.length <= progress
                  ? (isUser ? "rgba(255,255,255,0.95)" : "rgba(60,98,120,0.9)")
                  : (isUser ? "rgba(255,255,255,0.35)" : "rgba(60,98,120,0.28)"),
              }}
            />
          ))}
        </div>

        <span
          className={cn(
            "text-[11px] shrink-0 tabular-nums",
            isUser ? "text-white/75" : "text-muted-foreground"
          )}
        >
          {fmt(playing || progress > 0 ? currentTime : duration)}
        </span>
      </div>
    </div>
  );
}

// TTS integration (disabled):
// /** Soft-fail decode of TTS payload from chat responses (guide §3). */
// function audioUrlFromChatPayload(data: Record<string, unknown>): string | undefined {
//   const b64 = data.audio_base64;
//   if (typeof b64 !== "string" || !b64) return undefined;
//   const contentType =
//     typeof data.audio_content_type === "string" && data.audio_content_type.trim()
//       ? data.audio_content_type
//       : "audio/wav";
//   try {
//     const binary = atob(b64);
//     const bytes = new Uint8Array(binary.length);
//     for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
//     return URL.createObjectURL(new Blob([bytes], { type: contentType }));
//   } catch {
//     return undefined;
//   }
// }

// ─── Session helpers (conversation lifecycle guide) ──────────────────────────
// visitor_session_id and chat_history_id both live in localStorage, not
// sessionStorage: the lifecycle guide requires visitor_session_id to be
// "durable"/"long-lived in the browser" so a visitor returning within the 24h
// idle window (even after closing the tab) continues their existing
// conversation instead of the backend starting a new one.

function getVisitorSessionId(): string {
  const key = "hasab_visitor_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getChatHistoryId(): number | null {
  const v = localStorage.getItem("hasab_chat_history_id");
  return v ? Number(v) : null;
}

function saveChatHistoryId(id: number) {
  localStorage.setItem("hasab_chat_history_id", String(id));
}

function clearChatHistoryId() {
  localStorage.removeItem("hasab_chat_history_id");
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ChatWidgetProps {
  /**
   * Renders as a real bubble (launcher + toggled panel) positioned inside its
   * parent container instead of the viewport. Used for the live preview
   * inside the widget create/edit sheet, so it behaves like the actual
   * embedded widget rather than a flat mockup.
   */
  embedded?: boolean;
  /** Widget theme driving the preview's colors/labels — falls back to legacy widget config when absent. */
  theme?: ChatbotWidgetTheme;
  /** Widget settings driving the preview's text/feature toggles. */
  settings?: ChatbotWidgetSettings;
  /** Corner the bubble docks to when embedded. Defaults to bottom-right. */
  position?: WidgetPosition;
  welcomeMessage?: string;
  botNameOverride?: string;
  /** Initial language — widget.default_language from the form. Falls back to English. */
  defaultLanguage?: string;
}

function parsePx(value: string | undefined, fallback: number): number {
  const n = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function ChatWidget({
  embedded = false,
  theme,
  settings,
  position = "bottom-right",
  welcomeMessage,
  botNameOverride,
  defaultLanguage,
}: ChatWidgetProps = {}) {
  // Skip legacy `/api/widget` fetch when we already have real widget theme/settings
  // (floating bubble + widget preview). This avoids 404 spam from legacy endpoint.
  // Legacy single-widget config endpoint is noisy/optional; when we are
  // rendering a real widget preview (theme/settings provided), we don't need it.
  const { data: config } = useWidgetConfig({ enabled: false });
  const { user } = useAuthStore();
  // config (legacy useWidgetConfig) is this admin session's own single-widget
  // settings — never part of a real widget's data-theme, so it must not leak
  // in as a fallback once a real widget's theme is being tested (same reason
  // botName above gates out config/user data when settings is present).
  const primaryColor = theme ? (theme.primary_color ?? "#3C6278") : (config?.primary_color ?? "#3C6278");
  const userMsgColor = theme ? (theme.user_message_background ?? "#6F0001") : (config?.user_message_color ?? "#6F0001");
  const userMsgTextColor = theme?.user_message_text_color ?? "white";
  const panelBackground = theme?.panel_background ?? "white";
  const messageAreaBackground = theme?.message_area_background ?? "#f5f5f5";
  const botMsgBackground = theme?.bot_message_background ?? "white";
  const botMsgTextColor = theme?.bot_message_text_color ?? "#333";
  const borderColor = theme?.border_color ?? "#e0e0e0";
  const chipBackground = theme?.chip_background;
  const chipTextColor = theme?.chip_text_color;
  const mutedColor = "#999";
  const launcherBg = theme?.launcher?.background_color ?? primaryColor;
  const launcherText = theme?.launcher?.text_color ?? "white";
  // Explicit theme.launcher.label (including "" / null) wins — empty means icon-only.
  // Only fall back to settings.launcher_label when the theme field was never set.
  const launcherLabel =
    theme?.launcher != null && Object.prototype.hasOwnProperty.call(theme.launcher, "label")
      ? String(theme.launcher.label ?? "").trim()
      : (settings?.launcher_label ?? "").trim();
  const showLauncherText = theme?.launcher?.type !== "icon" && launcherLabel.length > 0;

  // Clamped to sane bounds — tighter when embedded so an arbitrary theme value
  // can't blow out the small preview box; looser for the real floating widget.
  const launcherSize = clamp(parsePx(theme?.launcher_size, 56), 40, embedded ? 72 : 96);
  const panelWidth = clamp(parsePx(theme?.panel_width, embedded ? 280 : 380), embedded ? 220 : 280, embedded ? 300 : 520);
  const panelHeight = clamp(parsePx(theme?.panel_height, embedded ? 420 : 620), embedded ? 320 : 400, embedded ? 480 : 720);

  const showMic = settings?.features?.audio_upload === true;
  const showPrompts = settings ? settings.features?.quick_prompts !== false : true;
  const showLangSelector = settings
    ? settings.features?.language_selector !== false &&
      settings.show_language_selector !== false
    : true;

  // isMounted prevents hydration mismatch: useAuthStore reads localStorage which
  // is unavailable on the server, so SSR and client initial render both use the
  // fallback, then swap to the real value after mount.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  // The config?.bot_name / user?.* fallback chain is legacy-only chrome: it
  // reads THIS admin session's own account data, which never reaches the
  // real embedded widget (it isn't part of the snippet's data-settings), so
  // it must never be used once a real widget (settings) is being tested —
  // otherwise the preview could show a name the actual snippet-rendered
  // widget could never produce.
  const botName = botNameOverride
    ?? (settings
      ? "Chat Assistant"
      : isMounted
        ? (config?.bot_name ?? user?.organization?.name ?? user?.name ?? "Ask Fayda")
        : "Ask Fayda");

  // Language — seeded from the widget's configured default_language, then
  // overridden by whatever the visitor picked last time (persisted to localStorage).
  // lang is a plain string (not the Lang union) because settings.languages can
  // list any code from the form; LANG_STRINGS only has full translations for
  // en/am/om today, so unknown codes fall back to the English strings below.
  const [lang, setLang] = useState<string>(normalizeUiLanguageCode(defaultLanguage ?? "en"));
  useEffect(() => {
    const stored = localStorage.getItem("hasabChatLang");
    if (stored) setLang(normalizeUiLanguageCode(stored));
  }, []);
  const ui = LANG_STRINGS[toLangKey(lang)];
  const langKey = toLangKey(lang);
  // Built-in UI strings for am/orm; English can use admin-configured overrides
  const displayWelcome =
    langKey === "en" ? (welcomeMessage ?? ui.welcomeBody) : ui.welcomeBody;
  const displayPlaceholder =
    langKey === "en"
      ? settings?.input_placeholder || ui.placeholder
      : ui.placeholder;
  const displaySubtitle =
    langKey === "en"
      ? settings?.subtitle || ui.subtitle
      : ui.subtitle;
  const languageOptions = useMemo(() => {
    const raw = settings?.languages?.length
      ? settings.languages
      : LANG_OPTIONS.map((o) => ({ code: o.value, label: o.native }));

    const seen = new Set<string>();
    return raw.reduce<{ code: string; label: string }[]>((acc, lang) => {
      const code = normalizeUiLanguageCode(lang.code);
      if (seen.has(code)) return acc;
      seen.add(code);
      acc.push({ code, label: lang.label });
      return acc;
    }, []);
  }, [settings?.languages]);

  // Widget sessions send language on every POST /chat — do not push a persistent
  // account "Language Preference" context (that can stick on Amharic and override en).
  const clearStaleLanguageContext = async () => {
    try {
      const r = await apiClient.get("/chat/context");
      const all: { id: number; name: string }[] = r.data?.contexts ?? r.data?.data ?? [];
      const existing = all.filter((c) => c.name === "Language Preference");
      if (existing.length === 0) return;
      await Promise.all(existing.map((c) => apiClient.delete(`/chat/context/${c.id}`)));
    } catch {
      // Silently fail — per-request language_instruction still sent on each message
    }
  };

  const changeLang = (next: string) => {
    const normalized = normalizeUiLanguageCode(next);
    if (normalized === lang) return;
    setLang(normalized);
    localStorage.setItem("hasabChatLang", normalized);
    // New language → fresh conversation so replies follow the visitor's pick,
    // not the admin default_language baked into an old chat_history_id.
    setMessages([]);
    clearHistoryId();
    void clearStaleLanguageContext();
  };

  // Chat state
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Embedded previews (widget editor) must not share chat_history_id across
  // different widgets being tested in the same browser, so continuity
  // is kept in a local ref instead of the shared localStorage key.
  const embeddedHistoryIdRef = useRef<number | null>(null);
  const getHistoryId = () => (embedded ? embeddedHistoryIdRef.current : getChatHistoryId());
  const saveHistoryId = (id: number) => {
    if (embedded) embeddedHistoryIdRef.current = id;
    else saveChatHistoryId(id);
  };
  const clearHistoryId = () => {
    if (embedded) embeddedHistoryIdRef.current = null;
    else clearChatHistoryId();
  };

  // Voice state
  const [micState, setMicState] = useState<MicState>("idle");
  const [recSecs, setRecSecs] = useState(0);

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, loading, open]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Clear stale account language context when the panel opens or language changes.
  useEffect(() => {
    if (open) void clearStaleLanguageContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lang]);

  // ── Send ──────────────────────────────────────────────────────────────────
  // Language integration: every message carries `language` + `language_instruction`.
  // TTS integration (disabled): tts / enable_tts / audio_base64 / Tigist player.

  const send = async (text: string, isVoice = false, audioUrl?: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, isVoice, audioUrl, ts: new Date() },
    ]);
    setLoading(true);

    await clearStaleLanguageContext();

    const visitorId = getVisitorSessionId();
    const chatHistoryId = getHistoryId();

    const chatLang = normalizeUiLanguageCode(lang);
    const langLabel = languageOptions.find((o) => o.code === chatLang)?.label;
    const languageInstruction = resolveLanguageInstruction(chatLang, langLabel);
    // const requestTts = shouldRequestTts(settings?.features?.tts, chatLang);

    const buildBody = (newConversation: boolean) => ({
      message: trimmed,
      model: "hasab-1-lite",
      source: "widget",
      page_url: window.location.href,
      language: chatLang,
      language_instruction: languageInstruction,
      // tts: requestTts,
      // enable_tts: requestTts,
      visitor_session_id: visitorId,
      client_metadata: {
        ...buildClientMetadata(chatLang),
        language_instruction: languageInstruction,
        // tts: requestTts,
      },
      ...(newConversation
        ? { new_conversation: true }
        : { chat_history_id: chatHistoryId }),
    });

    const applyResponse = (r: { data: Record<string, unknown> }) => {
      if (r.data?.chat_history_id) saveHistoryId(r.data.chat_history_id as number);
      const content =
        (r.data?.message as { content?: string })?.content ??
        (r.data?.data as { message?: string })?.message ??
        "No response received.";
      // const audioUrl = requestTts
      //   ? audioUrlFromChatPayload(r.data ?? {})
      //   : undefined;
      return { content };
    };

    try {
      const r = await apiClient.post("/chat", buildBody(!chatHistoryId), {
        headers: { "X-Visitor-Session-Id": visitorId },
      });
      const { content } = applyResponse(r);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content, ts: new Date() },
      ]);
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      // Stale chat_history_id — clear and retry as new conversation (guide §11)
      if (status === 404 && chatHistoryId) {
        clearHistoryId();
        try {
          const r2 = await apiClient.post("/chat", buildBody(true), {
            headers: { "X-Visitor-Session-Id": visitorId },
          });
          const { content } = applyResponse(r2);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content, ts: new Date() },
          ]);
          return;
        } catch { /* fall through to error message */ }
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to connect to the service. Please try again.",
          isError: true,
          ts: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── STT ───────────────────────────────────────────────────────────────────

  const transcribeAndSend = async (blob: Blob, mimeType: string) => {
    setMicState("processing");

    let finalBlob = blob;
    let fileName = "recording.wav";
    let finalMime = "audio/wav";

    if (!mimeType.includes("wav")) {
      try {
        finalBlob = await toWav(blob);
      } catch {
        if (mimeType.includes("ogg")) { fileName = "recording.ogg"; finalMime = "audio/ogg"; }
        else if (mimeType.includes("mp4")) { fileName = "recording.mp4"; finalMime = "audio/mp4"; }
        else { fileName = "recording.ogg"; finalMime = "audio/ogg"; }
        finalBlob = blob;
      }
    }

    const file = new File([finalBlob], fileName, { type: finalMime });
    const form = new FormData();
    form.append("audio", file);
    form.append("translate", "false");
    form.append("summarize", "false");
    form.append("is_meeting", "false");
    form.append("language", toSttLanguageCode(lang));
    form.append("source_language", toSttLanguageCode(lang));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const r = await apiClient.post("/upload-audio", form, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const d = r.data;
      let text: string =
        typeof d.data?.transcription === "string"
          ? d.data.transcription
          : d.data?.transcription?.text ??
          (typeof d.transcription === "string"
            ? d.transcription
            : d.transcription?.text) ??
          "";

      text = text.trim();
      if (!text) throw new Error("empty");

      setMicState("idle");
      setRecSecs(0);
      const audioUrl = URL.createObjectURL(finalBlob);
      await send(text, true, audioUrl);
    } catch {
      clearTimeout(timeout);
      setMicState("idle");
      setRecSecs(0);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not transcribe audio. Please try typing instead.",
          isError: true,
          ts: new Date(),
        },
      ]);
    }
  };

  // ── Recording controls ────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = bestMime();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        transcribeAndSend(blob, mimeType);
      };

      recorder.start();
      setMicState("recording");
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
    } catch {
      setMicState("idle");
    }
  };

  const pauseResumeRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (micState === "recording") {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      recorder.pause();
      setMicState("paused");
    } else if (micState === "paused") {
      recorder.resume();
      timerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
      setMicState("recording");
    }
  };

  const stopAndSubmitRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
  };

  const isEmpty = messages.length === 0;

  // Bubble docking corner — embedded docks inside its preview container,
  // non-embedded docks to the viewport; both use the same corner math so the
  // real floating widget matches the preview exactly.
  const isBottom = position.startsWith("bottom");
  const isLeft = position.endsWith("left");
  const originClass = `origin-${isBottom ? "bottom" : "top"}-${isLeft ? "left" : "right"}`;
  const edgeInset = embedded ? 16 : 24;
  const cornerOffsets = (verticalOffset: number): React.CSSProperties => ({
    ...(isBottom ? { bottom: verticalOffset } : { top: verticalOffset }),
    ...(isLeft ? { left: edgeInset } : { right: edgeInset }),
  });

  // ─────────────────────────────────────────────────────────────────────────

  const botAvatar = (size: number) => (
    <div
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}bb 100%)`,
      }}
    >
      {theme?.header?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={theme.header.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : theme?.header?.avatar_initials ? (
        <span className="text-white font-semibold" style={{ fontSize: size * 0.35 }}>
          {theme.header.avatar_initials}
        </span>
      ) : (
        <Bot className="text-white" style={{ width: size * 0.45, height: size * 0.45 }} />
      )}
    </div>
  );

  const resolvedPrompts = resolveQuickPromptsForLang(settings?.quick_prompts, lang);
  const quickPromptItems = resolvedPrompts
    ? resolvedPrompts.map((p) => ({ label: p.label, text: p.prompt }))
    : ui.prompts.map((q) => ({ label: q, text: q }));

  return (
    <div className={embedded ? "relative w-full h-full overflow-hidden" : "contents"}>
      {/* ── Floating panel ── */}
      <div
        className={cn(
          "flex flex-col overflow-hidden shadow-2xl rounded-2xl transition-all duration-300",
          originClass,
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none"
        )}
        style={{
          position: embedded ? "absolute" : "fixed",
          zIndex: embedded ? 10 : 50,
          width: embedded ? panelWidth : `min(${panelWidth}px, calc(100vw - 32px))`,
          height: embedded ? panelHeight : `min(${panelHeight}px, calc(100dvh - 120px))`,
          background: panelBackground,
          border: `1px solid ${borderColor}`,
          ...cornerOffsets(edgeInset + launcherSize + 8),
          ...(theme?.border_radius ? { borderRadius: theme.border_radius } : {}),
          ...(theme?.font_family ? { fontFamily: theme.font_family } : {}),
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center px-3 py-2.5 shrink-0 border-b gap-2"
          style={{ background: panelBackground, borderColor }}
        >
          {/* Back / collapse */}
         

          {/* Bot identity */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {botAvatar(34)}
            <div className="min-w-0">
              <p
                className="font-semibold text-sm leading-tight truncate"
                style={{ color: theme?.text_color ?? "#111" }}
              >
                {botName}
              </p>
              <p className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: mutedColor }}>
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "#22c55e", boxShadow: "0 0 0 2px rgba(34,197,94,0.3)" }}
                />
                {displaySubtitle}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {showLangSelector && (
              <div className="relative">
                <select
                  value={lang}
                  onChange={(e) => changeLang(e.target.value)}
                  className="appearance-none cursor-pointer rounded-lg pr-5 pl-2 py-1 text-[11px] font-medium focus:outline-none transition-all"
                  style={{
                    background: `${primaryColor}18`,
                    color: primaryColor,
                    border: `1px solid ${primaryColor}40`,
                  }}
                >
                  {languageOptions.map((o) => (
                    <option key={o.code} value={o.code} style={{ background: "white", color: "#111" }}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px]" style={{ color: primaryColor }}>
                  ▾
                </span>
              </div>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); clearHistoryId(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ color: theme?.text_color ?? "#555" }}
                title="New chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
              style={{ color: theme?.text_color ?? "#555" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Messages / Empty state ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ background: messageAreaBackground }}
        >
          {isEmpty ? (
            /* ── Empty / welcome state ── */
            <div className="flex flex-col items-center px-4 pt-8 pb-4">
              {/* Large bot avatar */}
              {botAvatar(72)}

              {/* Bot name */}
              <h2
                className="mt-4 text-xl font-bold leading-tight text-center"
                style={{ color: theme?.text_color ?? "#111" }}
              >
                {botName}
              </h2>
              <p
                className="mt-1 text-[12px] text-center"
                style={{ color: mutedColor }}
              >
                {displaySubtitle}
              </p>

              {/* "Today" date separator */}
              <div className="flex items-center w-full gap-3 mt-6 mb-4">
                <div className="flex-1 h-px" style={{ background: borderColor }} />
                <span className="text-[11px]" style={{ color: mutedColor }}>{ui.today}</span>
                <div className="flex-1 h-px" style={{ background: borderColor }} />
              </div>

              {/* Welcome message bubble — offset matches chip rows (spacer + gap) */}
              <div className="flex items-start gap-2 w-full mb-2">
                <div style={{ width: 26, flexShrink: 0 }} />
                <div
                  className="flex-1 rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
                  style={{
                    background: botMsgBackground,
                    border: `1px solid ${borderColor}`,
                    color: botMsgTextColor,
                    borderBottomLeftRadius: "4px",
                  }}
                >
                  {displayWelcome}
                </div>
              </div>

              {/* Quick prompt chips — parallel with welcome message; last chip has bot avatar */}
              {showPrompts && quickPromptItems.length > 0 && (
                <div className="w-full space-y-2 mt-1">
                  {quickPromptItems.map((q, idx, arr) => (
                    <div key={q.label} className="flex items-center gap-2">
                      {idx === arr.length - 1
                        ? botAvatar(26)
                        : <div style={{ width: 26, flexShrink: 0 }} />
                      }
                    <button
                      onClick={() => send(q.text)}
                      className="flex-1 text-[12px] px-4 py-2 rounded-full font-medium text-left transition-opacity hover:opacity-85 active:opacity-70"
                      style={{
                        background: chipBackground ?? `${primaryColor}18`,
                        color: chipTextColor ?? primaryColor,
                        border: `1.5px solid ${chipBackground ? "transparent" : `${primaryColor}40`}`,
                      }}
                    >
                      {q.label}
                    </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Active conversation ── */
            <div className="p-3.5 space-y-3">
              {/* "Today" separator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: borderColor }} />
                <span className="text-[11px]" style={{ color: mutedColor }}>{ui.today}</span>
                <div className="flex-1 h-px" style={{ background: borderColor }} />
              </div>

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start items-end"
                  )}
                >
                  {/* Bot avatar on left */}
                  {msg.role === "assistant" && botAvatar(26)}

                  <div className="flex flex-col gap-0.5 max-w-[76%]">
                    <div
                      className="rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed"
                      style={
                        msg.role === "user"
                          ? {
                            background: msg.isError ? "#fee2e2" : userMsgColor,
                            color: msg.isError ? "#b91c1c" : userMsgTextColor,
                            borderBottomRightRadius: "4px",
                          }
                          : {
                            background: msg.isError ? "#fee2e2" : botMsgBackground,
                            color: msg.isError ? "#b91c1c" : botMsgTextColor,
                            border: `1px solid ${msg.isError ? "#fca5a5" : borderColor}`,
                            borderBottomLeftRadius: "4px",
                          }
                      }
                    >
                      {msg.isVoice && msg.audioUrl ? (
                        <div className="space-y-1.5">
                          <VoiceMessage audioUrl={msg.audioUrl} tone="user" />
                          {msg.content && (
                            <p className="text-[11px] text-white leading-snug opacity-80 pt-0.5">
                              {msg.content}
                            </p>
                          )}
                        </div>
                      ) : msg.role === "assistant" && !msg.isError ? (
                        <div className="space-y-1.5">
                          {/* TTS integration (disabled):
                          {msg.playTts && msg.audioUrl && isTtsLanguage(msg.replyLang ?? lang) ? (
                            <VoiceMessage audioUrl={msg.audioUrl} tone="assistant" />
                          ) : null}
                          */}
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px]",
                        msg.role === "user" ? "text-right" : "text-left"
                      )}
                      style={{ color: mutedColor }}
                    >
                      {msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2 items-end">
                  {botAvatar(26)}
                  <div
                    className="rounded-2xl px-3.5 py-2.5"
                    style={{
                      background: botMsgBackground,
                      border: `1px solid ${borderColor}`,
                      borderBottomLeftRadius: "4px",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] italic" style={{ color: mutedColor }}>
                        {ui.thinking}
                      </span>
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map((j) => (
                          <span
                            key={j}
                            className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{
                              background: mutedColor,
                              animationDelay: `${j * 0.2}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input area ── */}
        <div
          className="shrink-0 px-3 py-3 border-t"
          style={{ background: panelBackground, borderColor }}
        >
          {/* Pill input row — content changes per micState */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              border: `1.5px solid ${micState === "recording" ? "#f87171" : micState === "paused" ? "#fbbf24" : borderColor}`,
              background: messageAreaBackground,
            }}
          >
            {micState === "recording" || micState === "paused" ? (
              /* ── Recording / paused state ── */
              <>
                <span
                  className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                  style={{
                    background: micState === "paused" ? "#f59e0b" : "#ef4444",
                    animationPlayState: micState === "paused" ? "paused" : "running",
                  }}
                />
                <span className="text-[12px] font-medium tabular-nums shrink-0" style={{ color: micState === "paused" ? "#f59e0b" : "#ef4444" }}>
                  {fmtSecs(recSecs)}
                  {micState === "paused" && <span className="ml-1 text-[10px] opacity-70">paused</span>}
                </span>
                <div className="flex-1" />
                {/* Pause / Resume */}
                <button
                  onClick={pauseResumeRecording}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-black/5"
                  style={{ color: mutedColor }}
                  title={micState === "recording" ? "Pause" : "Resume"}
                >
                  {micState === "recording"
                    ? <Pause className="w-3.5 h-3.5" />
                    : <Play className="w-3.5 h-3.5 translate-x-px" />
                  }
                </button>
                {/* Send (stop + submit) */}
                <button
                  onClick={stopAndSubmitRecording}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: primaryColor }}
                  title="Send recording"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </>
            ) : micState === "processing" ? (
              /* ── Transcribing state ── */
              <>
                <span className="flex-1 text-[13px]" style={{ color: mutedColor }}>
                  {theme?.mic?.processing_label || "Transcribing…"}
                </span>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: primaryColor }} />
              </>
            ) : (
              /* ── Idle state ── */
              <>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(input); } }}
                  placeholder={displayPlaceholder}
                  disabled={loading}
                  className="flex-1 bg-transparent text-[13px] focus:outline-none"
                  style={{ color: theme?.text_color ?? "#111" }}
                />
                {/* Right icon: mic when empty (and mic enabled), send when typing */}
                {showMic && !input.trim() ? (
                  <button
                    onClick={startRecording}
                    disabled={loading}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-black/5"
                    style={{ color: mutedColor }}
                    title="Record voice message"
                  >
                    {theme?.mic?.icon_url
                      ? <img src={theme.mic.icon_url} alt="" className="w-3.5 h-3.5" /> // eslint-disable-line @next/next/no-img-element
                      : <Mic className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <button
                    disabled={!input.trim() || loading}
                    onClick={() => send(input)}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-35"
                    style={{ background: primaryColor }}
                    title="Send"
                  >
                    {loading
                      ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      : theme?.send?.icon_url
                        ? <img src={theme.send.icon_url} alt="" className="w-3.5 h-3.5" /> // eslint-disable-line @next/next/no-img-element
                        : <Send className="w-3.5 h-3.5 text-white" />}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Launcher FAB ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          position: embedded ? "absolute" : "fixed",
          zIndex: embedded ? 10 : 50,
          width: launcherSize,
          height: launcherSize,
          borderRadius: "9999px",
          background: launcherBg,
          color: launcherText,
          ...cornerOffsets(edgeInset),
        }}
        title={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : theme?.launcher?.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.launcher.icon_url} alt="" className="w-6 h-6 object-contain" />
        ) : showLauncherText ? (
          <span className="flex items-center gap-1 px-1">
            <MessageSquareDot className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold truncate max-w-18">
              {launcherLabel}
            </span>
          </span>
        ) : (
          <MessageSquareDot className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}

