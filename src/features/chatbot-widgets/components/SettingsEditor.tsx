"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  ChatbotWidgetSettings,
  QuickPromptsMultilingual,
} from "../types/chatbot-widget.types";
import { normalizeQuickPrompts } from "../utils/quickPrompts";
import { QuickPromptsEditor } from "./QuickPromptsEditor";

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

  const languages = settings.languages ?? [];

  const promptsByLang: QuickPromptsMultilingual = useMemo(
    () => normalizeQuickPrompts(settings.quick_prompts, languages),
    [settings.quick_prompts, languages]
  );

  const [langCode, setLangCode] = useState("");
  const [langLabel, setLangLabel] = useState("");

  const addLanguage = () => {
    const code = langCode.trim();
    const label = langLabel.trim();
    if (!code || !label) return;
    if (languages.some((l) => l.code === code)) return;

    onChange({
      ...settings,
      languages: [...languages, { code, label }],
      quick_prompts: { ...promptsByLang, [code]: promptsByLang[code] ?? [] },
    });
    setLangCode("");
    setLangLabel("");
  };

  const removeLanguage = (code: string) => {
    const nextPrompts = { ...promptsByLang };
    delete nextPrompts[code];
    onChange({
      ...settings,
      languages: languages.filter((l) => l.code !== code),
      quick_prompts: nextPrompts,
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SectionHeader title="Text & Labels" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <Input
              value={settings.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ask Fayda"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subtitle
            </Label>
            <Input
              value={settings.subtitle ?? ""}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Ready to help"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Launcher Label
            </Label>
            <Input
              value={settings.launcher_label ?? ""}
              onChange={(e) => set("launcher_label", e.target.value)}
              placeholder="Ask"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Input Placeholder
            </Label>
            <Input
              value={settings.input_placeholder ?? ""}
              onChange={(e) => set("input_placeholder", e.target.value)}
              placeholder="Ask in your language..."
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Used for English. Amharic / Oromo use built-in translations when the visitor
              switches language.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader title="Features" />
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Audio Upload (Mic)</p>
              <p className="text-xs text-muted-foreground">
                Enable voice recording and transcription
              </p>
            </div>
            <Switch
              checked={settings.features?.audio_upload ?? false}
              onCheckedChange={(v) => setFeature("audio_upload", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Enable TTS replies</p>
              <p className="text-xs text-muted-foreground">
                Text replies follow the visitor&apos;s language. Amharic voice (Tigist) is added
                only when they select Amharic — English and Oromo are text-only.
              </p>
            </div>
            <Switch
              checked={settings.features?.tts ?? false}
              onCheckedChange={(v) => setFeature("tts", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Quick Prompts</p>
              <p className="text-xs text-muted-foreground">
                Show prompt chip shortcuts to visitors
              </p>
            </div>
            <Switch
              checked={settings.features?.quick_prompts ?? true}
              onCheckedChange={(v) => setFeature("quick_prompts", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Language Selector</p>
              <p className="text-xs text-muted-foreground">
                Show language dropdown for visitors
              </p>
            </div>
            <Switch
              checked={settings.features?.language_selector ?? true}
              onCheckedChange={(v) => setFeature("language_selector", v)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader title="Languages" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Use the same codes the CDN expects (e.g. <code className="font-mono">en</code>,{" "}
          <code className="font-mono">am</code>/<code className="font-mono">amh</code>,{" "}
          <code className="font-mono">orm</code>/<code className="font-mono">om</code>). Quick
          prompt tabs follow this list.
        </p>
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
        {languages.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No languages added — quick prompts will use an English tab by default.
          </p>
        ) : (
          <div className="space-y-1.5">
            {languages.map((lang) => (
              <div
                key={lang.code}
                className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2"
              >
                <code className="w-10 shrink-0 font-mono text-xs text-muted-foreground">
                  {lang.code}
                </code>
                <span className="flex-1 text-sm">{lang.label}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {(promptsByLang[lang.code] ?? []).length} prompts
                </span>
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

      <div className="space-y-3">
        <SectionHeader title="Quick Prompts" />
        <QuickPromptsEditor
          languages={languages}
          promptsByLang={promptsByLang}
          onChange={(next) => set("quick_prompts", next)}
        />
      </div>
    </div>
  );
}
