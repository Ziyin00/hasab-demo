import { chatbotApiClient } from "@/lib/api-client";
import type {
  ChatCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/category.types";

export const categoryApi = {
  list: async (widgetId: number): Promise<ChatCategory[]> => {
    const r = await chatbotApiClient.get(`/chatbot-widgets/${widgetId}/categories`);
    return r.data.data?.categories ?? r.data.data ?? [];
  },

  create: async (widgetId: number, payload: CreateCategoryPayload): Promise<ChatCategory> => {
    const r = await chatbotApiClient.post(`/chatbot-widgets/${widgetId}/categories`, payload);
    return r.data.data?.category ?? r.data.data;
  },

  update: async (
    widgetId: number,
    categoryId: number,
    payload: UpdateCategoryPayload
  ): Promise<ChatCategory> => {
    const r = await chatbotApiClient.patch(
      `/chatbot-widgets/${widgetId}/categories/${categoryId}`,
      payload
    );
    return r.data.data?.category ?? r.data.data;
  },

  delete: async (widgetId: number, categoryId: number): Promise<void> => {
    await chatbotApiClient.delete(`/chatbot-widgets/${widgetId}/categories/${categoryId}`);
  },

  reorder: async (widgetId: number, orderedIds: number[]): Promise<ChatCategory[]> => {
    const r = await chatbotApiClient.post(`/chatbot-widgets/${widgetId}/categories/reorder`, {
      ordered_ids: orderedIds,
    });
    return r.data.data?.categories ?? r.data.data ?? [];
  },
};
