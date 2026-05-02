import { create } from "zustand";
import type { NormalizedTranscriptionPayload, TranscriptionRequest } from "@/features/transcription/types/transcription.types";

interface TranscriptionState {
  lastRequest: TranscriptionRequest | null;
  lastResult: NormalizedTranscriptionPayload | null;
  lastSrt: string;
  audioId: string | null;
  audioUrl: string | null;
  isProcessing: boolean;
  error: string | null;
  setLastRequest: (request: TranscriptionRequest) => void;
  setLastResult: (result: NormalizedTranscriptionPayload | null) => void;
  setLastSrt: (srt: string) => void;
  setAudioMeta: (audioId: string | null, audioUrl: string | null) => void;
  setIsProcessing: (value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
  lastRequest: null,
  lastResult: null,
  lastSrt: "",
  audioId: null,
  audioUrl: null,
  isProcessing: false,
  error: null,
  setLastRequest: (lastRequest) => set({ lastRequest }),
  setLastResult: (lastResult) => set({ lastResult }),
  setLastSrt: (lastSrt) => set({ lastSrt }),
  setAudioMeta: (audioId, audioUrl) => set({ audioId, audioUrl }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      lastRequest: null,
      lastResult: null,
      lastSrt: "",
      audioId: null,
      audioUrl: null,
      isProcessing: false,
      error: null,
    }),
}));
