"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Send, X, RotateCcw, Bot, Loader2,
  MessageSquareDot, Mic, Square, Play, Pause,
} from "lucide-react";
import { useWidgetConfig } from "@/features/widget/hooks/useWidget";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  ChatbotWidgetTheme,
  ChatbotWidgetSettings,
  WidgetPosition,
} from "@/features/chatbot-widgets/types/chatbot-widget.types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  isVoice?: boolean;
  audioUrl?: string;
  ts: Date;
}

type MicState = "idle" | "recording" | "processing";
type Lang = "en" | "am" | "om";

// ─── Language strings (mirrors fayda-demo.html) ───────────────────────────────

const LANG_STRINGS: Record<Lang, {
  label: string;
  placeholder: string;
  online: string;
  thinking: string;
  welcomeTitle: string;
  welcomeBody: string;
  prompts: string[];
  /** Stored server-side as a context — never prepended to messages */
  contextInstruction: string;
  sttLang: string;
}> = {
  en: {
    label: "English",
    placeholder: "Type your message...",
    online: "Online",
    thinking: "Thinking",
    welcomeTitle: "Welcome",
    welcomeBody: "Pick a question above, type, or tap the mic to speak.",
    prompts: ["What can you help me with?", "Tell me about your features", "How do I get started?"],
    contextInstruction: "CRITICAL: You MUST respond ONLY in English. Do not use any other language.",
    sttLang: "eng",
  },
  am: {
    label: "አማርኛ",
    placeholder: "መልዕክትዎን ይፃፉ...",
    online: "ኦንላይን",
    thinking: "እያሰበ ነው",
    welcomeTitle: "እንኳን ወደ ቻቱ በደህና መጡ",
    welcomeBody: "ጥያቄ ይምረጡ፣ ይፃፉ ወይም ሚክሮፎኑን ይጫኑ።",
    prompts: ["ምን ሊረዱኝ ይችላሉ?", "ስለ ፕሮዳክቱ ይናገሩ", "እንዴት እጀምር?"],
    contextInstruction: "CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). Do not use English or any other language.",
    sttLang: "amh",
  },
  om: {
    label: "Afaan Oromoo",
    placeholder: "Ergaa kee barreessi...",
    online: "Online",
    thinking: "Yaadaa jira",
    welcomeTitle: "Baga nagaan dhufte",
    welcomeBody: "Gaaffii filadhu, barreessi yookaan miikrofoona tuqi.",
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

function VoiceMessage({ audioUrl }: { audioUrl: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white/20 hover:bg-white/30 transition-colors"
        >
          {playing
            ? <Pause className="w-3.5 h-3.5 text-white" />
            : <Play className="w-3.5 h-3.5 text-white translate-x-px" />}
        </button>

        {/* Waveform bars */}
        <div className="flex items-center gap-px flex-1 h-7">
          {bars.map((h, i) => (
            <div
              key={i}
              className="rounded-full w-1 shrink-0 transition-colors duration-100"
              style={{
                height: `${h * 100}%`,
                background: i / bars.length <= progress
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>

        {/* Time */}
        <span className="text-[11px] text-white/75 shrink-0 tabular-nums">
          {fmt(playing || progress > 0 ? currentTime : duration)}
        </span>
      </div>

    </div>
  );
}

// ─── Session helpers (guide §1) ──────────────────────────────────────────────

function getVisitorSessionId(): string {
  const key = "hasab_visitor_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getChatHistoryId(): number | null {
  const v = sessionStorage.getItem("hasab_chat_history_id");
  return v ? Number(v) : null;
}

function saveChatHistoryId(id: number) {
  sessionStorage.setItem("hasab_chat_history_id", String(id));
}

function clearChatHistoryId() {
  sessionStorage.removeItem("hasab_chat_history_id");
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
}: ChatWidgetProps = {}) {
  const { data: config } = useWidgetConfig();
  const { user } = useAuthStore();
  const primaryColor = theme?.primary_color ?? config?.primary_color ?? "#3C6278";
  const userMsgColor = theme?.user_message_background ?? config?.user_message_color ?? "#6F0001";
  const userMsgTextColor = theme?.user_message_text_color ?? "white";
  const panelBackground = theme?.panel_background ?? "white";
  const messageAreaBackground = theme?.message_area_background ?? "#f5f5f5";
  const botMsgBackground = theme?.bot_message_background ?? "white";
  const botMsgTextColor = theme?.bot_message_text_color ?? "#333";
  const borderColor = theme?.border_color ?? "#e0e0e0";
  const chipBackground = theme?.chip_background;
  const chipTextColor = theme?.chip_text_color;
  const launcherBg = theme?.launcher?.background_color ?? primaryColor;
  const launcherText = theme?.launcher?.text_color ?? "white";

  // Clamped to sane bounds — tighter when embedded so an arbitrary theme value
  // can't blow out the small preview box; looser for the real floating widget.
  const launcherSize = clamp(parsePx(theme?.launcher_size, 56), 40, embedded ? 72 : 96);
  const panelWidth = clamp(parsePx(theme?.panel_width, embedded ? 280 : 380), embedded ? 220 : 280, embedded ? 300 : 520);
  const panelHeight = clamp(parsePx(theme?.panel_height, embedded ? 420 : 620), embedded ? 320 : 400, embedded ? 480 : 720);

  const showMic = settings ? settings.features?.audio_upload !== false : true;
  const showPrompts = settings ? settings.features?.quick_prompts !== false : true;
  const showLangSelector = settings ? settings.features?.language_selector !== false : true;

  // isMounted prevents hydration mismatch: useAuthStore reads localStorage which
  // is unavailable on the server, so SSR and client initial render both use the
  // fallback, then swap to the real value after mount.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  const botName = botNameOverride
    ?? (isMounted
      ? (config?.bot_name ?? user?.organization?.name ?? user?.name ?? "Ask Fayda")
      : "Ask Fayda");

  // Language — persisted to localStorage
  const [lang, setLang] = useState<Lang>("am");
  useEffect(() => {
    const stored = localStorage.getItem("hasabChatLang") as Lang;
    if (stored) setLang(stored);
  }, []);
  const ui = LANG_STRINGS[lang];

  // Push language preference as a server-side context (mirrors fayda-demo.html updateLanguageContext)
  const updateLangContext = async (l: Lang) => {
    const instruction = LANG_STRINGS[l].contextInstruction;
    try {
      const r = await apiClient.get("/chat/context");
      const all: { id: number; name: string }[] = r.data?.contexts ?? r.data?.data ?? [];
      const existing = all.filter((c) => c.name === "Language Preference");
      await Promise.all(existing.map((c) => apiClient.delete(`/chat/context/${c.id}`)));
      if (existing.length > 0) await new Promise((res) => setTimeout(res, 300));
      await apiClient.post("/chat/context", {
        context_data: instruction,
        name: "Language Preference",
        priority: 100,
        is_active: true,
      });
    } catch {
      // Silently fail — don't block the user
    }
  };

  const changeLang = (next: Lang) => {
    setLang(next);
    localStorage.setItem("hasabChatLang", next);
    updateLangContext(next);
  };

  // Chat state
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Embedded previews (widget editor) must not share chat_history_id across
  // different widgets being tested in the same browser session, so continuity
  // is kept in a local ref instead of the shared sessionStorage key.
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

  // Push language context to server whenever the widget opens or language changes
  useEffect(() => {
    if (open) updateLangContext(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lang]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const send = async (text: string, isVoice = false, audioUrl?: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, isVoice, audioUrl, ts: new Date() },
    ]);
    setLoading(true);

    const visitorId = getVisitorSessionId();
    const chatHistoryId = getHistoryId();

    const buildBody = (newConversation: boolean) => ({
      message: trimmed,
      model: "hasab-1-lite",
      source: "widget",
      page_url: window.location.href,
      language: lang,
      ...(newConversation
        ? { new_conversation: true }
        : { chat_history_id: chatHistoryId }),
    });

    const applyResponse = (r: { data: Record<string, unknown> }) => {
      if (r.data?.chat_history_id) saveHistoryId(r.data.chat_history_id as number);
      return (
        (r.data?.message as { content?: string })?.content ??
        (r.data?.data as { message?: string })?.message ??
        "No response received."
      );
    };

    try {
      const r = await apiClient.post("/chat", buildBody(!chatHistoryId), {
        headers: { "X-Visitor-Session-Id": visitorId },
      });
      const content = applyResponse(r);
      setMessages((prev) => [...prev, { role: "assistant", content, ts: new Date() }]);
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      // Stale chat_history_id — clear and retry as new conversation (guide §11)
      if (status === 404 && chatHistoryId) {
        clearHistoryId();
        try {
          const r2 = await apiClient.post("/chat", buildBody(true), {
            headers: { "X-Visitor-Session-Id": visitorId },
          });
          const content = applyResponse(r2);
          setMessages((prev) => [...prev, { role: "assistant", content, ts: new Date() }]);
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
    form.append("language", ui.sttLang);
    form.append("source_language", ui.sttLang);

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

  // ── Toggle recording ──────────────────────────────────────────────────────

  const toggleRecording = async () => {
    if (micState === "processing") return;

    if (micState === "recording") {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      mediaRecorderRef.current?.stop();
      return;
    }

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

  return (
    <div className={embedded ? "relative w-full h-full overflow-hidden" : "contents"}>
      {/* ── Floating panel ── */}
      <div
        className={cn(
          "flex flex-col overflow-hidden shadow-2xl border border-gray-200 rounded-2xl transition-all duration-300",
          originClass,
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none"
        )}
        style={{
          position: embedded ? "absolute" : "fixed",
          zIndex: embedded ? 10 : 50,
          width: panelWidth,
          height: panelHeight,
          background: panelBackground,
          ...cornerOffsets(edgeInset + launcherSize + 8),
          ...(theme?.border_radius ? { borderRadius: theme.border_radius } : {}),
          ...(theme?.font_family ? { fontFamily: theme.font_family } : {}),
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}bb 100%)`,
          }}
        >
          {/* Left: bot identity */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              {theme?.header?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={theme.header.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : theme?.header?.avatar_initials ? (
                <span className="text-white text-[11px] font-semibold">
                  {theme.header.avatar_initials}
                </span>
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">
                {botName}
              </p>
              <p className="flex items-center gap-1 text-white/90 text-[11px] mt-0.5">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: "#22c55e",
                    boxShadow: "0 0 0 2px rgba(34,197,94,0.35)",
                  }}
                />
                {settings?.subtitle || ui.online}
              </p>
            </div>
          </div>

          {/* Right: language selector + controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language select — styled like fayda-demo.html */}
            {showLangSelector && (
              <div className="relative">
                <select
                  value={lang}
                  onChange={(e) => changeLang(e.target.value as Lang)}
                  className="appearance-none cursor-pointer rounded-[10px] pr-6 pl-3 py-1.5 text-[11px] font-semibold text-white focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    border: "2px solid rgba(255,255,255,0.6)",
                    minWidth: 90,
                  }}
                >
                  {LANG_OPTIONS.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      style={{ background: "white", color: primaryColor }}
                    >
                      {o.native}
                    </option>
                  ))}
                </select>
                {/* Custom arrow */}
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white text-[9px] font-bold">
                  ▾
                </span>
              </div>
            )}

            {/* New chat */}
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); clearHistoryId(); }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title="New chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── FAQ strip ── */}
        {isEmpty && showPrompts && (
          <div className="px-3 py-2 border-b bg-white flex gap-1.5 flex-wrap shrink-0">
            {(settings?.quick_prompts?.length
              ? settings.quick_prompts.map((p) => ({ label: p.label, text: p.prompt }))
              : ui.prompts.map((q) => ({ label: q, text: q }))
            ).map((q) => (
              <button
                key={q.label}
                onClick={() => send(q.text)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap"
                style={
                  chipBackground
                    ? { background: chipBackground, color: chipTextColor, borderColor: "transparent" }
                    : undefined
                }
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Messages ── */}
        <div
          className="flex-1 overflow-y-auto p-3.5 space-y-2.5"
          style={{ background: messageAreaBackground }}
        >
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}bb 100%)`,
                }}
              >
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">
                  {ui.welcomeTitle}
                </h3>
                <p className="text-[11px] text-gray-500 mt-1 max-w-[220px] leading-relaxed">
                  {welcomeMessage ?? ui.welcomeBody}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div className="flex flex-col gap-0.5 max-w-[80%]">
                <div
                  className="rounded-lg px-3 py-2 text-[13px] leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                        background: msg.isError ? "#fee2e2" : userMsgColor,
                        color: msg.isError ? "#b91c1c" : userMsgTextColor,
                        borderBottomRightRadius: "2px",
                      }
                      : {
                        background: msg.isError ? "#fee2e2" : botMsgBackground,
                        color: msg.isError ? "#b91c1c" : botMsgTextColor,
                        border: `1px solid ${msg.isError ? "#fca5a5" : borderColor}`,
                        borderBottomLeftRadius: "2px",
                      }
                  }
                >
                  {msg.isVoice && msg.audioUrl ? (
                    <div className="space-y-1.5">
                      <VoiceMessage audioUrl={msg.audioUrl} />
                      {msg.content && (
                        <p className="text-[11px] text-white leading-snug opacity-80 pt-0.5">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  ) : msg.role === "assistant" && !msg.isError ? (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  ) : (
                    msg.content
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] text-gray-400",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}
                >
                  {msg.ts.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div
                className="rounded-lg px-3 py-2.5"
                style={{
                  background: "white",
                  border: "1px solid #e0e0e0",
                  borderBottomLeftRadius: "2px",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 italic">
                    {ui.thinking}
                  </span>
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input area ── */}
        <div className="border-t bg-white shrink-0">
          {/* Recording status strip */}
          {micState === "recording" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border-b border-red-100">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] text-red-600 font-medium">
                Recording {fmtSecs(recSecs)}
              </span>
              <span className="text-[10px] text-red-400 ml-auto">Tap ■ to stop</span>
            </div>
          )}
          {micState === "processing" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-100">
              <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
              <span className="text-[11px] text-amber-600 font-medium">
                Transcribing audio…
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-2.5">
            {/* Mic button */}
            {showMic && (
              <button
                onClick={toggleRecording}
                disabled={loading}
                title={
                  micState === "recording" ? "Stop recording" : "Record voice message"
                }
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
                  micState === "recording" && "animate-pulse"
                )}
                style={
                  micState === "recording"
                    ? { background: "#e74c3c", color: "white", border: "none" }
                    : micState === "processing"
                      ? { background: "#f39c12", color: "white", border: "none" }
                      : {
                        background: "transparent",
                        color: primaryColor,
                        border: `2px solid ${primaryColor}`,
                      }
                }
              >
                {micState === "processing" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : micState === "recording" ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Text input */}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); send(input); }
              }}
              placeholder={
                micState === "recording"
                  ? "Listening…"
                  : micState === "processing"
                    ? "Transcribing…"
                    : settings?.input_placeholder || ui.placeholder
              }
              disabled={loading || micState !== "idle"}
              className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-[13px] text-black focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={
                { ["--tw-ring-color" as string]: primaryColor } as React.CSSProperties
              }
            />

            {/* Send button */}
            <button
              disabled={!input.trim() || loading || micState !== "idle"}
              onClick={() => send(input)}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
              style={{ background: primaryColor }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Launcher FAB ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          position: embedded ? "absolute" : "fixed",
          zIndex: embedded ? 10 : 50,
          width: launcherSize,
          height: launcherSize,
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
        ) : theme?.launcher?.label ? (
          <span className="text-xs font-semibold px-1">{theme.launcher.label}</span>
        ) : (
          <MessageSquareDot className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
