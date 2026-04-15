import { create } from "zustand";

interface MeetingState {
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  isProcessing: false,
  setIsProcessing: (processing) => set({ isProcessing: processing }),
}));
