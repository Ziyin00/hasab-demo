"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useTTSStore } from "@/store/tts.store";
import { ttsApi } from "../api/tts.api";

export const useTTS = () => {
  const {
    text,
    language,
    speakerName,
    isSynthesizing,
    setIsSynthesizing,
    setAudio,
    clearAudio,
  } = useTTSStore();

  const generateSpeech = useCallback(async () => {
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }
    if (!speakerName) {
      toast.error("Please select a speaker");
      return;
    }

    setIsSynthesizing(true);
    clearAudio();
    try {
      const blob = await ttsApi.synthesize(text, language, speakerName);
      setAudio(blob);
      toast.success("Speech generated successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to generate speech");
    } finally {
      setIsSynthesizing(false);
    }
  }, [text, language, speakerName, setIsSynthesizing, clearAudio, setAudio]);

  return { generateSpeech, isSynthesizing };
};
