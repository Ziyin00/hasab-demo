import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api";
import type { ConversationsFilter } from "../types/analytics.types";

export function useConversations(filters: ConversationsFilter) {
  return useQuery({
    queryKey: ["conversations", filters],
    queryFn: () => analyticsApi.getConversations(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useConversationDetail(id: number | null) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => analyticsApi.getConversation(id!),
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
  });
}
