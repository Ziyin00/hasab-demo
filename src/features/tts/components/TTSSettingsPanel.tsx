"use client";

import { RotateCcw } from "lucide-react";
import { useTTSStore } from "@/store/tts.store";
import { TTSVoiceSelector } from "./TTSVoiceSelector";

export function TTSSettingsPanel() {
  const resetSettings = useTTSStore((s) => s.resetSettings);

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Voice</span>
        <button
          onClick={resetSettings}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Value
        </button>
      </div>
      <TTSVoiceSelector />
    </div>
  );
}
