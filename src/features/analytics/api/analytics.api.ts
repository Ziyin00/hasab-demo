import { apiClient } from "@/lib/api-client";
import type {
  AnalyticsData,
  AnalyticsRange,
  ConversationsData,
  ConversationsFilter,
  ConversationDetail,
} from "../types/analytics.types";

export const analyticsApi = {
  get: async (range: AnalyticsRange = "30d"): Promise<AnalyticsData> => {
    const r = await apiClient.get("/chat/analytics", { params: { range } });
    return r.data.data;
  },

  getConversations: async (params: ConversationsFilter): Promise<ConversationsData> => {
    const r = await apiClient.get("/chat/conversations", { params });
    return r.data.data;
  },

  getConversation: async (id: number): Promise<ConversationDetail> => {
    const r = await apiClient.get(`/chat/conversations/${id}`);
    return r.data.data.conversation;
  },

  postFeedback: async ({
    chat_history_id,
    rating,
  }: {
    chat_history_id: number;
    rating: "positive" | "negative";
  }): Promise<void> => {
    await apiClient.post("/chat/feedback", { chat_history_id, rating });
  },
};
