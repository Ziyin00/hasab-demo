"use client";

import { Globe, Loader2, Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTTSStore } from "@/store/tts.store";
import { useTTS } from "../hooks/useTTS";
import { TTSAudioPlayer } from "./TTSAudioPlayer";
import { LANGUAGE_NAMES } from "./TTSVoiceSelector";

const MAX_CHARS = 5000;

interface TTSEditorProps {
  onOpenSettings?: () => void;
}

export function TTSEditor({ onOpenSettings }: TTSEditorProps) {
  const { text, setText, language, setLanguage, speakersData, audioUrl } = useTTSStore();
  const { generateSpeech, isSynthesizing } = useTTS();

  const availableLanguages = speakersData ? Object.keys(speakersData.languages) : ["am", "om"];

  return (
    <div className="flex flex-col h-full">
      {/* Text area */}
      <div className="flex-1 p-4 sm:p-5 min-h-0">
        <Textarea
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
          }}
          placeholder="Start typing here..."
          className="h-full resize-none border-0 shadow-none !bg-background text-base placeholder:text-muted-foreground/50 focus-visible:ring-0 p-0 leading-relaxed"
        />
      </div>

      {/* Audio player */}
      {audioUrl && (
        <div className="px-4 sm:px-5 pb-3">
          <TTSAudioPlayer src={audioUrl} className="w-full" />
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t gap-2">
        {/* Left: language + char count */}
        <div className="flex items-center gap-1 min-w-0">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-8 w-auto border-none shadow-none bg-transparent text-sm gap-1.5 px-2 hover:bg-muted/50 rounded-md focus:ring-0">
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {LANGUAGE_NAMES[lang] ?? lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="hidden sm:inline text-xs text-muted-foreground whitespace-nowrap pl-1">
            {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>

        {/* Right: settings trigger (mobile only) + generate */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline text-xs text-muted-foreground whitespace-nowrap">
            Credit Usage
          </span>

          {/* Settings button — only visible on mobile */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-full border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
              aria-label="Open settings"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          )}

          <Button
            onClick={generateSpeech}
            disabled={isSynthesizing || !text.trim()}
            className="h-9 px-4 sm:px-5 rounded-full text-white gap-2 shadow-sm"
          >
            {isSynthesizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>Generate</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
