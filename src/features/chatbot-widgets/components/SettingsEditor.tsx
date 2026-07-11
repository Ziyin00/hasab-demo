"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ChatbotWidgetSettings, LanguageOption, QuickPrompt } from "../types/chatbot-widget.types";

interface SettingsEditorProps {
  settings: ChatbotWidgetSettings;
  onChange: (settings: ChatbotWidgetSettings) => void;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
      {title}
    </p>
  );
}

export function SettingsEditor({ settings, onChange }: SettingsEditorProps) {
  const set = <K extends keyof ChatbotWidgetSettings>(key: K, val: ChatbotWidgetSettings[K]) =>
    onChange({ ...settings, [key]: val });

  const setFeature = <K extends keyof NonNullable<ChatbotWidgetSettings["features"]>>(
    key: K,
    val: boolean
  ) => onChange({ ...settings, features: { ...settings.features, [key]: val } });

  // Language management
  const [langCode, setLangCode] = useState("");
  const [langLabel, setLangLabel] = useState("");

  const addLanguage = () => {
    if (!langCode.trim() || !langLabel.trim()) return;
    const langs = settings.languages ?? [];
    if (langs.some((l) => l.code === langCode.trim())) return;
    set("languages", [...langs, { code: langCode.trim(), label: langLabel.trim() }]);
    setLangCode("");
    setLangLabel("");
  };

  const removeLanguage = (code: string) => {
    set("languages", (settings.languages ?? []).filter((l) => l.code !== code));
  };

  // Quick prompt management
  const [promptLabel, setPromptLabel] = useState("");
  const [promptText, setPromptText] = useState("");

  const addPrompt = () => {
    if (!promptLabel.trim() || !promptText.trim()) return;
    const prompts = settings.quick_prompts ?? [];
    set("quick_prompts", [...prompts, { label: promptLabel.trim(), prompt: promptText.trim() }]);
    setPromptLabel("");
    setPromptText("");
  };

  const removePrompt = (index: number) => {
    set("quick_prompts", (settings.quick_prompts ?? []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      {/* General text */}
      <div className="space-y-3">
        <SectionHeader title="Text & Labels" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</Label>
            <Input value={settings.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Ask Fayda" className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtitle</Label>
            <Input value={settings.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Ready to help" className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Launcher Label</Label>
            <Input value={settings.launcher_label ?? ""} onChange={(e) => set("launcher_label", e.target.value)} placeholder="Ask" className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Input Placeholder</Label>
            <Input value={settings.input_placeholder ?? ""} onChange={(e) => set("input_placeholder", e.target.value)} placeholder="Ask in your language..." className="text-sm" />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <SectionHeader title="Features" />
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Audio Upload (Mic)</p>
              <p className="text-xs text-muted-foreground">Enable voice recording and transcription</p>
            </div>
            <Switch
              checked={settings.features?.audio_upload ?? false}
              onCheckedChange={(v) => setFeature("audio_upload", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Quick Prompts</p>
              <p className="text-xs text-muted-foreground">Show prompt chip shortcuts to visitors</p>
            </div>
            <Switch
              checked={settings.features?.quick_prompts ?? false}
              onCheckedChange={(v) => setFeature("quick_prompts", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Language Selector</p>
              <p className="text-xs text-muted-foreground">Show language dropdown for visitors</p>
            </div>
            <Switch
              checked={settings.features?.language_selector ?? false}
              onCheckedChange={(v) => setFeature("language_selector", v)}
            />
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-3">
        <SectionHeader title="Languages" />
        <div className="flex gap-2">
          <Input
            value={langCode}
            onChange={(e) => setLangCode(e.target.value)}
            placeholder="Code (e.g. am)"
            className="text-sm w-28 shrink-0"
          />
          <Input
            value={langLabel}
            onChange={(e) => setLangLabel(e.target.value)}
            placeholder="Label (e.g. Amharic)"
            className="text-sm flex-1"
          />
          <Button type="button" size="sm" onClick={addLanguage} className="shrink-0 gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        {(settings.languages ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No languages added.</p>
        ) : (
          <div className="space-y-1.5">
            {(settings.languages ?? []).map((lang) => (
              <div key={lang.code} className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
                <code className="text-xs font-mono text-muted-foreground w-8 shrink-0">{lang.code}</code>
                <span className="flex-1 text-sm">{lang.label}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeLanguage(lang.code)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="space-y-3">
        <SectionHeader title="Quick Prompts" />
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={promptLabel}
              onChange={(e) => setPromptLabel(e.target.value)}
              placeholder="Chip label (e.g. Services)"
              className="text-sm flex-1"
            />
            <Button type="button" size="sm" onClick={addPrompt} className="shrink-0 gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <Input
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Full prompt text sent to the bot"
            className="text-sm"
          />
        </div>
        {(settings.quick_prompts ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No quick prompts added.</p>
        ) : (
          <div className="space-y-1.5">
            {(settings.quick_prompts ?? []).map((qp, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border bg-muted/20 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{qp.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{qp.prompt}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removePrompt(i)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
