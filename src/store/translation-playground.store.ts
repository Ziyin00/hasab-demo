import { create } from "zustand";
import {
  coerceStoredTranslationPayload,
  type TranslationApiStoredBody,
} from "@/features/translation/utils/translationResultPayload";

/** Same localStorage key as legacy global store — body shape is `.data.translation` (+ optional wrapper fields). */
export const TRANSLATION_RESULT_STORAGE_KEY = "translationResult";

export type PersistedTranslationResult = TranslationApiStoredBody;

export function readTranslationResultFromStorage(): PersistedTranslationResult | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(TRANSLATION_RESULT_STORAGE_KEY);
    if (!stored) return null;
    return coerceStoredTranslationPayload(JSON.parse(stored));
  } catch {
    return null;
  }
}

interface TranslationPlaygroundState {
  translationResult: PersistedTranslationResult | null;
  hydrateTranslationResultFromStorage: () => void;
  /** Legacy: `JSON.stringify(res.data)`. Also accepts `{ raw: res.data }` from migration. */
  setTranslationResult: (val: PersistedTranslationResult | null) => void;
}

export const useTranslationPlaygroundStore = create<TranslationPlaygroundState>((set) => ({
  translationResult: null,
  hydrateTranslationResultFromStorage: () => set({ translationResult: readTranslationResultFromStorage() }),
  setTranslationResult: (val) => {
    try {
      if (typeof window !== "undefined") {
        if (val) {
          window.localStorage.setItem(TRANSLATION_RESULT_STORAGE_KEY, JSON.stringify(val));
        } else {
          window.localStorage.removeItem(TRANSLATION_RESULT_STORAGE_KEY);
        }
      }
    } catch {
      /* storage disabled / quota */
    }
    set({ translationResult: val });
  },
}));
