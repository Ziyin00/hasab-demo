"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChatbotWidgetTheme } from "../types/chatbot-widget.types";

interface ThemeEditorProps {
  theme: ChatbotWidgetTheme;
  onChange: (theme: ChatbotWidgetTheme) => void;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  const val = value ?? "#000000";
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="flex gap-2 items-center">
        <div className="relative h-9 w-9 rounded-md overflow-hidden border shrink-0">
          <input
            type="color"
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            value={val}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="absolute inset-0 rounded-md" style={{ background: val }} />
        </div>
        <Input
          value={val}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-sm"
      />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1 col-span-full">
      {title}
    </p>
  );
}

export function ThemeEditor({ theme, onChange }: ThemeEditorProps) {
  const set = <K extends keyof ChatbotWidgetTheme>(key: K, val: ChatbotWidgetTheme[K]) =>
    onChange({ ...theme, [key]: val });

  const setLauncher = <K extends keyof NonNullable<ChatbotWidgetTheme["launcher"]>>(
    key: K,
    val: NonNullable<ChatbotWidgetTheme["launcher"]>[K]
  ) => onChange({ ...theme, launcher: { ...theme.launcher, [key]: val } });

  const setHeader = <K extends keyof NonNullable<ChatbotWidgetTheme["header"]>>(
    key: K,
    val: NonNullable<ChatbotWidgetTheme["header"]>[K]
  ) => onChange({ ...theme, header: { ...theme.header, [key]: val } });

  const setMic = <K extends keyof NonNullable<ChatbotWidgetTheme["mic"]>>(
    key: K,
    val: NonNullable<ChatbotWidgetTheme["mic"]>[K]
  ) => onChange({ ...theme, mic: { ...theme.mic, [key]: val } });

  const setSend = <K extends keyof NonNullable<ChatbotWidgetTheme["send"]>>(
    key: K,
    val: NonNullable<ChatbotWidgetTheme["send"]>[K]
  ) => onChange({ ...theme, send: { ...theme.send, [key]: val } });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SectionHeader title="Colors" />

      <ColorField label="Primary Color" value={theme.primary_color} onChange={(v) => set("primary_color", v)} />
      <ColorField label="Panel Background" value={theme.panel_background} onChange={(v) => set("panel_background", v)} />
      <ColorField label="Message Area Background" value={theme.message_area_background} onChange={(v) => set("message_area_background", v)} />
      <ColorField label="Text Color" value={theme.text_color} onChange={(v) => set("text_color", v)} />
      <ColorField label="Bot Message Background" value={theme.bot_message_background} onChange={(v) => set("bot_message_background", v)} />
      <ColorField label="Bot Message Text Color" value={theme.bot_message_text_color} onChange={(v) => set("bot_message_text_color", v)} />
      <ColorField label="User Message Background" value={theme.user_message_background} onChange={(v) => set("user_message_background", v)} />
      <ColorField label="User Message Text Color" value={theme.user_message_text_color} onChange={(v) => set("user_message_text_color", v)} />
      <ColorField label="Chip Background" value={theme.chip_background} onChange={(v) => set("chip_background", v)} />
      <ColorField label="Chip Text Color" value={theme.chip_text_color} onChange={(v) => set("chip_text_color", v)} />
      <ColorField label="Border Color" value={theme.border_color} onChange={(v) => set("border_color", v)} />

      <SectionHeader title="Layout" />

      <TextField label="Font Family" value={theme.font_family} onChange={(v) => set("font_family", v)} placeholder="Inter, system-ui, sans-serif" />
      <TextField label="Border Radius" value={theme.border_radius} onChange={(v) => set("border_radius", v)} placeholder="18px" />
      <TextField label="Panel Width" value={theme.panel_width} onChange={(v) => set("panel_width", v)} placeholder="400px" />
      <TextField label="Panel Height" value={theme.panel_height} onChange={(v) => set("panel_height", v)} placeholder="580px" />
      <TextField label="Launcher Size" value={theme.launcher_size} onChange={(v) => set("launcher_size", v)} placeholder="64px" />

      <SectionHeader title="Launcher Bubble" />

      <TextField label="Launcher Type" value={theme.launcher?.type} onChange={(v) => setLauncher("type", v)} placeholder="text" />
      <TextField label="Launcher Label" value={theme.launcher?.label} onChange={(v) => setLauncher("label", v)} placeholder="Ask" />
      <TextField label="Launcher Icon URL" value={theme.launcher?.icon_url ?? ""} onChange={(v) => setLauncher("icon_url", v || null)} placeholder="https://..." />
      <ColorField label="Launcher Background" value={theme.launcher?.background_color} onChange={(v) => setLauncher("background_color", v)} />
      <ColorField label="Launcher Text Color" value={theme.launcher?.text_color} onChange={(v) => setLauncher("text_color", v)} />

      <SectionHeader title="Header" />

      <TextField label="Avatar URL" value={theme.header?.avatar_url ?? ""} onChange={(v) => setHeader("avatar_url", v || null)} placeholder="https://..." />
      <TextField label="Avatar Initials" value={theme.header?.avatar_initials} onChange={(v) => setHeader("avatar_initials", v)} placeholder="AF" />

      <SectionHeader title="Mic Button" />

      <TextField label="Idle Label" value={theme.mic?.label} onChange={(v) => setMic("label", v)} placeholder="Talk" />
      <TextField label="Recording Label" value={theme.mic?.recording_label} onChange={(v) => setMic("recording_label", v)} placeholder="Stop" />
      <TextField label="Processing Label" value={theme.mic?.processing_label} onChange={(v) => setMic("processing_label", v)} placeholder="Wait" />
      <TextField label="Idle Icon URL" value={theme.mic?.icon_url ?? ""} onChange={(v) => setMic("icon_url", v || null)} placeholder="https://..." />
      <TextField label="Recording Icon URL" value={theme.mic?.recording_icon_url ?? ""} onChange={(v) => setMic("recording_icon_url", v || null)} placeholder="https://..." />
      <ColorField label="Idle Background" value={theme.mic?.background_color} onChange={(v) => setMic("background_color", v)} />
      <ColorField label="Recording Background" value={theme.mic?.recording_background_color} onChange={(v) => setMic("recording_background_color", v)} />
      <ColorField label="Processing Background" value={theme.mic?.processing_background_color} onChange={(v) => setMic("processing_background_color", v)} />
      <ColorField label="Mic Text Color" value={theme.mic?.text_color} onChange={(v) => setMic("text_color", v)} />

      <SectionHeader title="Send Button" />

      <TextField label="Send Label" value={theme.send?.label} onChange={(v) => setSend("label", v)} placeholder="Send" />
      <TextField label="Send Icon URL" value={theme.send?.icon_url ?? ""} onChange={(v) => setSend("icon_url", v || null)} placeholder="https://..." />
    </div>
  );
}
