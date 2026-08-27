"use client";

import { useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  LanguageOption,
  QuickPrompt,
  QuickPromptsMultilingual,
} from "../types/chatbot-widget.types";

interface QuickPromptsEditorProps {
  languages: LanguageOption[];
  promptsByLang: QuickPromptsMultilingual;
  /** True when showing seeded defaults (API omitted the key) — not persisted yet. */
  usingBuiltInSeed: boolean;
  onChange: (next: QuickPromptsMultilingual) => void;
  /** Omit quick_prompts so the widget falls back to built-in chips. */
  onResetToDefaults: () => void;
}

export function QuickPromptsEditor({
  languages,
  promptsByLang,
  usingBuiltInSeed,
  onChange,
  onResetToDefaults,
}: QuickPromptsEditorProps) {
  const tabs =
    languages.length > 0 ? languages : [{ code: "en", label: "English" }];

  const [activeLang, setActiveLang] = useState(tabs[0]?.code ?? "en");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);

  const safeLang = tabs.some((t) => t.code === activeLang)
    ? activeLang
    : tabs[0]?.code ?? "en";

  const activePrompts: QuickPrompt[] = promptsByLang[safeLang] ?? [];
  const langKeyMissing =
    !usingBuiltInSeed && !Object.prototype.hasOwnProperty.call(promptsByLang, safeLang);
  const pendingPrompt =
    pendingRemoveIndex != null ? activePrompts[pendingRemoveIndex] : null;

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

  const confirmRemovePrompt = () => {
    if (pendingRemoveIndex == null) return;
    setLangPrompts(
      safeLang,
      activePrompts.filter((_, i) => i !== pendingRemoveIndex)
    );
    setPendingRemoveIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[11px] leading-relaxed text-muted-foreground max-w-xl">
          Configure chips <strong className="font-medium text-foreground">per language</strong>.
          Saving stores the full visible list for each language you edit (remaining defaults +
          your chips). Empty list = no chips for that language. Missing language key = visitors
          still see built-in chips.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1.5 text-xs"
          onClick={onResetToDefaults}
          disabled={usingBuiltInSeed}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to defaults
        </Button>
      </div>

      {usingBuiltInSeed ? (
        <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          Showing built-in chips as a starting point. They are not saved until you add, edit, or
          remove a chip (or otherwise change this list).
        </p>
      ) : null}

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

        {langKeyMissing ? (
          <p className="text-xs italic text-muted-foreground">
            No custom list for this language — visitors see built-in chips. Add a chip to start a
            custom list (defaults are not auto-copied).
          </p>
        ) : activePrompts.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            No chips for this language. Saving an empty list hides chips for visitors in this
            language.
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
                    onClick={() => setPendingRemoveIndex(i)}
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
              placeholder="New chip label"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPrompt();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 gap-1"
              onClick={addPrompt}
              disabled={!draftLabel.trim() || !draftPrompt.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <Input
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            placeholder="Full prompt text sent to the bot"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPrompt();
              }
            }}
          />
        </div>
      </div>

      <Dialog
        open={pendingRemoveIndex != null}
        onOpenChange={(open) => !open && setPendingRemoveIndex(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this prompt?</DialogTitle>
            <DialogDescription>
              {pendingPrompt?.label ? (
                <>
                  Remove chip{" "}
                  <span className="font-medium text-foreground">
                    &ldquo;{pendingPrompt.label}&rdquo;
                  </span>{" "}
                  from this language. Changes apply after you save.
                </>
              ) : (
                "This prompt chip will be removed. Changes apply after you save."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingRemoveIndex(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmRemovePrompt}>
              Remove prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
