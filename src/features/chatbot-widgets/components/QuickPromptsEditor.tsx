"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  LanguageOption,
  QuickPrompt,
  QuickPromptsMultilingual,
} from "../types/chatbot-widget.types";

interface QuickPromptsEditorProps {
  languages: LanguageOption[];
  promptsByLang: QuickPromptsMultilingual;
  onChange: (next: QuickPromptsMultilingual) => void;
}

export function QuickPromptsEditor({
  languages,
  promptsByLang,
  onChange,
}: QuickPromptsEditorProps) {
  const tabs =
    languages.length > 0 ? languages : [{ code: "en", label: "English" }];

  const [activeLang, setActiveLang] = useState(tabs[0]?.code ?? "en");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");

  // If active tab was removed, snap to first available
  const safeLang = tabs.some((t) => t.code === activeLang)
    ? activeLang
    : tabs[0]?.code ?? "en";

  const activePrompts: QuickPrompt[] = promptsByLang[safeLang] ?? [];

  const setLangPrompts = (code: string, list: QuickPrompt[]) => {
    onChange({ ...promptsByLang, [code]: list });
  };

  const addPrompt = () => {
    if (!draftLabel.trim() || !draftPrompt.trim()) return;
    setLangPrompts(safeLang, [
      ...activePrompts,
      { label: draftLabel.trim(), prompt: draftPrompt.trim() },
    ]);
    setDraftLabel("");
    setDraftPrompt("");
  };

  const updatePrompt = (index: number, patch: Partial<QuickPrompt>) => {
    setLangPrompts(
      safeLang,
      activePrompts.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  };

  const removePrompt = (index: number) => {
    setLangPrompts(
      safeLang,
      activePrompts.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Configure chips <strong className="font-medium text-foreground">per language</strong>.
        When a visitor switches language in the widget, matching prompts are shown. Missing
        languages fall back to English, then built-in defaults.
      </p>

      {/* Language tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
        {tabs.map((lang) => {
          const count = (promptsByLang[lang.code] ?? []).length;
          const selected = safeLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveLang(lang.code)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                selected
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {lang.label}
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  selected ? "text-primary" : "text-muted-foreground/70"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-3">
        <p className="text-[11px] font-medium text-muted-foreground">
          Editing prompts for{" "}
          <span className="font-semibold text-foreground">
            {tabs.find((l) => l.code === safeLang)?.label ?? safeLang}
          </span>{" "}
          <code className="font-mono text-[10px]">({safeLang})</code>
        </p>

        {/* Existing prompts — editable */}
        {activePrompts.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            No prompts for this language yet. Visitors will fall back to English or built-in
            chips.
          </p>
        ) : (
          <div className="space-y-2">
            {activePrompts.map((qp, i) => (
              <div
                key={`${safeLang}-${i}`}
                className="space-y-1.5 rounded-lg border bg-muted/20 p-2.5"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={qp.label}
                    onChange={(e) => updatePrompt(i, { label: e.target.value })}
                    placeholder="Chip label"
                    className="h-8 text-sm font-medium"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removePrompt(i)}
                    aria-label="Remove prompt"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Input
                  value={qp.prompt}
                  onChange={(e) => updatePrompt(i, { prompt: e.target.value })}
                  placeholder="Full prompt text sent to the bot"
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        <div className="space-y-1.5 border-t pt-3">
          <div className="flex gap-2">
            <Input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder="Chip label (e.g. Pricing)"
              className="text-sm flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPrompt();
                }
              }}
            />
            <Button type="button" size="sm" onClick={addPrompt} className="shrink-0 gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <Input
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            placeholder="Full prompt text sent to the bot"
            className="text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPrompt();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
