import { create } from "zustand";

interface TranscriptionState {
  currentUploads: any[];
  addUpload: (upload: any) => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
  currentUploads: [],
  addUpload: (upload) => set((state) => ({ currentUploads: [...state.currentUploads, upload] })),
}));
