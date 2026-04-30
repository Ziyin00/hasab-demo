"use client";

import { Globe, Loader2, Sparkles, UploadCloud, Smile } from "lucide-react";
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

export function TTSEditor() {
  const { text, setText, language, setLanguage, speakersData, audioUrl } = useTTSStore();
  const { generateSpeech, isSynthesizing } = useTTS();

  const availableLanguages = speakersData ? Object.keys(speakersData.languages) : ["amh", "orm"];

  const append = (tag: string) => setText(text + tag);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-5 min-h-0">
        <Textarea
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
          }}
          placeholder={
            "Start typing here..."
          }
          className="h-full resize-none border-0 shadow-none !bg-background text-base placeholder:text-muted-foreground/50 focus-visible:ring-0 p-0 leading-relaxed"
        />
      </div>

      {audioUrl && (
        <div className="px-5 pb-3">
          <TTSAudioPlayer src={audioUrl} className="w-full" />
        </div>
      )}



      <div className="flex items-center justify-between px-4 py-3 border-t gap-4">
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

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Credit Usage</span>
          <Button
            onClick={generateSpeech}
            disabled={isSynthesizing || !text.trim()}
            className="h-9 px-5 rounded-full bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-sm"
          >
            {isSynthesizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
