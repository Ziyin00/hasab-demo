import { create } from "zustand";
import type { TTSHistoryRecord, TTSSpeakersResponse } from "@/features/tts/types/tts.types";

const DEFAULT_SETTINGS = {
  language: "amh",
  speakerName: "Hanna",
  speed: 1,
  pitch: 0,
  volume: 1,
};

interface TTSState {
  text: string;
  setText: (text: string) => void;

  language: string;
  setLanguage: (language: string) => void;
  speakerName: string;
  setSpeakerName: (name: string) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;

  speakersData: TTSSpeakersResponse | null;
  setSpeakersData: (data: TTSSpeakersResponse) => void;

  audioBlob: Blob | null;
  audioUrl: string | null;
  setAudio: (blob: Blob) => void;
  clearAudio: () => void;

  isSynthesizing: boolean;
  setIsSynthesizing: (loading: boolean) => void;

  history: TTSHistoryRecord[];
  historyTotal: number;
  historyOffset: number;
  setHistory: (records: TTSHistoryRecord[], total: number) => void;
  appendHistory: (records: TTSHistoryRecord[], total: number) => void;
  setHistoryOffset: (offset: number) => void;
  removeHistoryRecord: (id: number) => void;
  isLoadingHistory: boolean;
  setIsLoadingHistory: (loading: boolean) => void;

  resetSettings: () => void;
}

export const useTTSStore = create<TTSState>((set, get) => ({
  text: "",
  setText: (text) => set({ text }),

  ...DEFAULT_SETTINGS,
  setLanguage: (language) => set({ language, speakerName: "" }),
  setSpeakerName: (speakerName) => set({ speakerName }),
  setSpeed: (speed) => set({ speed }),
  setPitch: (pitch) => set({ pitch }),
  setVolume: (volume) => set({ volume }),

  speakersData: null,
  setSpeakersData: (speakersData) => set({ speakersData }),

  audioBlob: null,
  audioUrl: null,
  setAudio: (blob) => {
    const prev = get().audioUrl;
    if (prev) URL.revokeObjectURL(prev);
    const url = URL.createObjectURL(blob);
    set({ audioBlob: blob, audioUrl: url });
  },
  clearAudio: () => {
    const prev = get().audioUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({ audioBlob: null, audioUrl: null });
  },

  isSynthesizing: false,
  setIsSynthesizing: (isSynthesizing) => set({ isSynthesizing }),

  history: [],
  historyTotal: 0,
  historyOffset: 0,
  setHistory: (records, total) => set({ history: records, historyTotal: total }),
  appendHistory: (records, total) =>
    set((state) => ({
      history: [...state.history, ...records],
      historyTotal: total,
    })),
  setHistoryOffset: (historyOffset) => set({ historyOffset }),
  removeHistoryRecord: (id) =>
    set((state) => ({
      history: state.history.filter((r) => r.id !== id),
      historyTotal: Math.max(0, state.historyTotal - 1),
    })),
  isLoadingHistory: false,
  setIsLoadingHistory: (isLoadingHistory) => set({ isLoadingHistory }),

  resetSettings: () => set({ ...DEFAULT_SETTINGS }),
}));
