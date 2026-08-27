import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useAuthStore } from "@/store/auth.store";
import { chatbotWidgetApi } from "../api/chatbot-widget.api";
import type {
  CreateChatbotWidgetPayload,
  UpdateChatbotWidgetPayload,
} from "../types/chatbot-widget.types";

const WIDGETS_KEY = ["chatbot-widgets"] as const;

export function useChatbotWidget(id: number) {
  const authenticated = useAuthStore((s) => s.authenticated);
  return useQuery({
    queryKey: ["chatbot-widget", id],
    queryFn: () => chatbotWidgetApi.get(id),
    staleTime: 2 * 60 * 1000,
    enabled: authenticated && Number.isFinite(id) && id > 0,
  });
}

export function useChatbotWidgets() {
  const authenticated = useAuthStore((s) => s.authenticated);
  return useQuery({
    queryKey: WIDGETS_KEY,
    queryFn: chatbotWidgetApi.list,
    staleTime: 2 * 60 * 1000,
    enabled: authenticated,
  });
}

export function useCreateChatbotWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChatbotWidgetPayload) => chatbotWidgetApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_KEY });
      toast.success("Widget created");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to create widget");
    },
  });
}

export function useUpdateChatbotWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateChatbotWidgetPayload }) =>
      chatbotWidgetApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_KEY });
      toast.success("Widget saved");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to save widget");
    },
  });
}

export function useDeleteChatbotWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => chatbotWidgetApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_KEY });
      toast.success("Widget deleted");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to delete widget");
    },
  });
}
