"use client";

import { useState } from "react";
import { Loader2, Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguageHelper } from "../hooks/useContexts";
import { LANGUAGE_OPTIONS } from "../types/context.types";

const LANG_NATIVE: Record<string, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Afaan Oromoo",
  tir: "ትግርኛ",
};

interface Props {
  apiKey: string;
}

export function LanguageHelperCard({ apiKey }: Props) {
  const [language, setLanguage] = useState("en");
  const { mutate: updateLanguage, isPending, isSuccess } = useLanguageHelper(apiKey);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b bg-muted/20 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 flex-shrink-0">
          <Languages className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Language Preference</p>
          <p className="text-xs text-muted-foreground mt-0.5">AI response language</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Creates a high-priority context that forces AI responses in your selected language.
        </p>

        {/* Language grid */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Select Language
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = language === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!apiKey}
                  onClick={() => setLanguage(opt.value)}
                  className={`relative flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition-all disabled:opacity-50 ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/30 hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <span className={`text-xs font-semibold leading-none ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {LANG_NATIVE[opt.value] ?? opt.label}
                  </span>
                  <span className={`text-[10px] leading-none ${isSelected ? "text-primary/70" : "text-muted-foreground"}`}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={() => updateLanguage(language)}
          disabled={isPending || !apiKey}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : isSuccess ? (
            <Check className="mr-2 h-3.5 w-3.5" />
          ) : null}
          {isPending ? "Applying..." : "Apply Language"}
        </Button>
      </div>
    </div>
  );
}
