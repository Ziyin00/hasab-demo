import { apiClient } from "@/lib/api-client";
import type {
  TTSSpeakersResponse,
  TTSHistoryResponse,
  TTSHistoryRecord,
  TTSHistoryParams,
} from "../types/tts.types";

const LANGUAGE_CODE_MAP: Record<string, string> = {
  tir: "tig",
};

const normalizeLanguage = (lang: string) => LANGUAGE_CODE_MAP[lang] ?? lang;

export const ttsApi = {
  getSpeakers: async (language?: string): Promise<TTSSpeakersResponse> => {
    const params = language ? { language } : {};
    const response = await apiClient.get<TTSSpeakersResponse>("/tts/speakers", { params });
    return response.data;
  },

  synthesize: async (text: string, language: string, speaker_name: string): Promise<Blob> => {
    const response = await apiClient.post(
      "/tts/synthesize",
      { text, language: normalizeLanguage(language), speaker_name },
      { responseType: "blob" }
    );
    return response.data as Blob;
  },

  getHistory: async (params?: TTSHistoryParams): Promise<TTSHistoryResponse> => {
    const response = await apiClient.get<TTSHistoryResponse>("/tts/history", { params });
    return response.data;
  },

  getRecord: async (recordId: number): Promise<TTSHistoryRecord> => {
    const response = await apiClient.get<{ record: TTSHistoryRecord }>(`/tts/record/${recordId}`);
    return response.data.record;
  },

  deleteRecord: async (recordId: number): Promise<void> => {
    await apiClient.delete(`/tts/record/${recordId}`);
  },
};
