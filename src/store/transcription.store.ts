import { create } from "zustand";
import type { NormalizedTranscriptionPayload, TranscriptionRequest } from "@/features/transcription/types/transcription.types";

export interface ActiveTranscriptionJob {
  phase: "uploading" | "processing" | "done" | "error";
  fileName: string;
  progress: number;
  audioId: string | null;
  error: string | null;
}

interface TranscriptionState {
  lastRequest: TranscriptionRequest | null;
  lastResult: NormalizedTranscriptionPayload | null;
  lastSrt: string;
  audioId: string | null;
  audioUrl: string | null;
  isProcessing: boolean;
  error: string | null;
  job: ActiveTranscriptionJob | null;
  setLastRequest: (request: TranscriptionRequest) => void;
  setLastResult: (result: NormalizedTranscriptionPayload | null) => void;
  setLastSrt: (srt: string) => void;
  setAudioMeta: (audioId: string | null, audioUrl: string | null) => void;
  setIsProcessing: (value: boolean) => void;
  setError: (error: string | null) => void;
  setJob: (job: ActiveTranscriptionJob | null) => void;
  updateJobProgress: (progress: number) => void;
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
  job: null,
  setLastRequest: (lastRequest) => set({ lastRequest }),
  setLastResult: (lastResult) => set({ lastResult }),
  setLastSrt: (lastSrt) => set({ lastSrt }),
  setAudioMeta: (audioId, audioUrl) => set({ audioId, audioUrl }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  setJob: (job) => set({ job }),
  updateJobProgress: (progress) =>
    set((state) => (state.job ? { job: { ...state.job, progress } } : {})),
  reset: () =>
    set({
      lastRequest: null,
      lastResult: null,
      lastSrt: "",
      audioId: null,
      audioUrl: null,
      isProcessing: false,
      error: null,
      job: null,
    }),
}));
