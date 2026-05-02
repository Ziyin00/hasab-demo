import { apiClient } from "@/lib/api-client";
import type {
  TranscriptionPage,
  TranscriptionRecord,
  TranslationPage,
  TranslationRecord,
} from "../types/history.types";

export const historyApi = {
  getTranscriptions: (page: number) =>
    apiClient
      .get<{ status: string; data: TranscriptionPage }>("/audios", { params: { page } })
      .then((r) => r.data.data),

  getTranscription: (id: number) =>
    apiClient
      .get<{ status: string; data: TranscriptionRecord }>(`/audios/${id}`)
      .then((r) => r.data.data),

  getTranslations: (page: number) =>
    apiClient
      .get<{ status: string; data: { translations: TranslationPage } }>("/translations", {
        params: { page },
      })
      .then((r) => r.data.data.translations),

  getTranslation: (id: number) =>
    apiClient
      .get<{ status: string; data: TranslationRecord }>(`/translations/${id}`)
      .then((r) => r.data.data),

  deleteTranscription: (id: number) => apiClient.delete(`/audios/${id}`),
  deleteTranslation: (id: number) => apiClient.delete(`/translations/${id}`),
};
