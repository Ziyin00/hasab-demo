import { apiClient } from "@/lib/api-client";
import type {
  RagStore,
  RagDocument,
  RagQueryResult,
  CreateStorePayload,
} from "../types/rag.types";

export const ragApi = {
  listStores: async (): Promise<RagStore[]> => {
    const r = await apiClient.get("/rag/stores");
    return r.data?.data?.stores ?? [];
  },

  createStore: async (payload: CreateStorePayload): Promise<RagStore> => {
    const r = await apiClient.post("/rag/stores", payload);
    return r.data.data.store;
  },

  deleteStore: async (storeId: number): Promise<void> => {
    await apiClient.delete(`/rag/stores/${storeId}`);
  },

  listDocuments: async (storeId: number): Promise<RagDocument[]> => {
    const r = await apiClient.get(`/rag/stores/${storeId}/documents`);
    return r.data?.data?.documents ?? [];
  },

  uploadDocument: async (storeId: number, file: File): Promise<RagDocument> => {
    const form = new FormData();
    form.append("file", file);
    const r = await apiClient.post(`/rag/stores/${storeId}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data.data.document;
  },

  queryStore: async (
    storeId: number,
    question: string,
    topK = 3
  ): Promise<RagQueryResult> => {
    const r = await apiClient.post(`/rag/stores/${storeId}/query`, {
      question,
      top_k: topK,
    });
    return r.data.data;
  },
};
