import { chatbotApiClient } from "@/lib/api-client";
import type {
  ChatbotWidget,
  CreateChatbotWidgetPayload,
  UpdateChatbotWidgetPayload,
} from "../types/chatbot-widget.types";

export const chatbotWidgetApi = {
  list: async (): Promise<ChatbotWidget[]> => {
    const r = await chatbotApiClient.get("/chatbot-widgets");
    return r.data.data?.widgets ?? r.data.data ?? [];
  },

  get: async (id: number): Promise<ChatbotWidget> => {
    const r = await chatbotApiClient.get(`/chatbot-widgets/${id}`);
    return r.data.data?.widget ?? r.data.data;
  },

  create: async (payload: CreateChatbotWidgetPayload): Promise<ChatbotWidget> => {
    const r = await chatbotApiClient.post("/chatbot-widgets", payload);
    return r.data.data?.widget ?? r.data.data;
  },

  update: async (id: number, payload: UpdateChatbotWidgetPayload): Promise<ChatbotWidget> => {
    const r = await chatbotApiClient.patch(`/chatbot-widgets/${id}`, payload);
    return r.data.data?.widget ?? r.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await chatbotApiClient.delete(`/chatbot-widgets/${id}`);
  },
};
