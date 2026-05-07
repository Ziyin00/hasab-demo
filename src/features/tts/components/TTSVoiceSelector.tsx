"use client";

import { User } from "lucide-react";
import { useTTSStore } from "@/store/tts.store";
import { useTTSSpeakers } from "../hooks/useTTSSpeakers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const LANGUAGE_NAMES: Record<string, string> = {
  am: "Amharic (አማርኛ)",
  om: "Oromo (Afaan Oromoo)",
  en: "English",
  tig: "Tigrinya (ትግርኛ)",
};

export function TTSVoiceSelector() {
  const { language, speakerName, setLanguage, setSpeakerName } = useTTSStore();
  const { availableLanguages, availableSpeakers } = useTTSSpeakers();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {speakerName || "Select a speaker"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {LANGUAGE_NAMES[language] ?? language}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">Language</label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full h-8 text-sm">
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
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">Speaker</label>
        <Select value={speakerName} onValueChange={setSpeakerName}>
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue placeholder="Select speaker" />
          </SelectTrigger>
          <SelectContent>
            {availableSpeakers.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
