import { create } from "zustand";

interface SubtitleState {
  editorOpen: boolean;
  setEditorOpen: (open: boolean) => void;
}

export const useSubtitleStore = create<SubtitleState>((set) => ({
  editorOpen: false,
  setEditorOpen: (open) => set({ editorOpen: open }),
}));
