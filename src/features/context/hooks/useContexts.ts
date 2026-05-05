import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { contextApi } from "../api/context.api";
import { getLanguageInstruction } from "../types/context.types";
import type { ContextFormData } from "../types/context.types";

export function useContexts(apiKey: string) {
  return useQuery({
    queryKey: ["context", "list", apiKey],
    queryFn: () => contextApi.list(apiKey),
    enabled: !!apiKey.trim(),
  });
}

export function useCreateContext(apiKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContextFormData) => contextApi.create(apiKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", "list", apiKey] });
      toast.success("Context created");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to create context");
    },
  });
}

export function useUpdateContext(apiKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContextFormData> }) =>
      contextApi.update(apiKey, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", "list", apiKey] });
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to update context");
    },
  });
}

export function useDeleteContext(apiKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contextApi.delete(apiKey, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", "list", apiKey] });
      toast.success("Context deleted");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to delete context");
    },
  });
}

export function useLanguageHelper(apiKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (language: string) => {
      const list = await contextApi.list(apiKey);
      const existing = list.filter((c) => c.name === "Language Preference");
      for (const c of existing) {
        await contextApi.delete(apiKey, c.id);
      }
      await contextApi.create(apiKey, {
        name: "Language Preference",
        priority: 100,
        is_active: true,
        context_data: getLanguageInstruction(language),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", "list", apiKey] });
      toast.success("Language preference context updated");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to update language context");
    },
  });
}
