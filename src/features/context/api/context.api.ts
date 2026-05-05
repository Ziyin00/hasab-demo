import axios from "axios";
import type { ContextItem, ContextFormData } from "../types/context.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.hasab.ai/api/v1";

function makeClient(apiKey: string) {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
}

export const contextApi = {
  list: async (apiKey: string): Promise<ContextItem[]> => {
    const r = await makeClient(apiKey).get("/chat/context");
    const d = r.data;
    const list: ContextItem[] = d?.contexts ?? d?.data ?? (Array.isArray(d) ? d : []);
    return [...list].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  },

  create: async (apiKey: string, data: ContextFormData): Promise<ContextItem> => {
    const r = await makeClient(apiKey).post("/chat/context", data);
    return r.data?.context ?? ({ ...data, id: Date.now() } as unknown as ContextItem);
  },

  update: async (
    apiKey: string,
    id: number,
    data: Partial<ContextFormData>
  ): Promise<ContextItem> => {
    const r = await makeClient(apiKey).put(`/chat/context/${id}`, data);
    return r.data?.context ?? ({ id, ...data } as unknown as ContextItem);
  },

  delete: async (apiKey: string, id: number): Promise<void> => {
    await makeClient(apiKey).delete(`/chat/context/${id}`);
  },

  chat: async (apiKey: string, message: string, model: string): Promise<string> => {
    const r = await makeClient(apiKey).post("/chat", { message, model });
    const d = r.data;
    return d?.message?.content ?? d?.message?.message ?? d?.response ?? "";
  },

  transcribe: async (apiKey: string, file: File, language: string): Promise<string> => {
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("language", language);
    formData.append("source_language", language);
    formData.append("translate", "false");
    formData.append("summarize", "false");
    formData.append("is_meeting", "false");
    const r = await makeClient(apiKey).post("/upload-audio", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const transcription = r.data?.data?.transcription ?? r.data?.transcription ?? "";
    return typeof transcription === "string"
      ? transcription
      : (transcription?.text ?? "No transcription returned.");
  },
};
