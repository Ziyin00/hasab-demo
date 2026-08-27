import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { categoryApi } from "../api/category.api";
import type { CreateCategoryPayload, UpdateCategoryPayload } from "../types/category.types";

const categoriesKey = (widgetId: number) => ["chatbot-widget", widgetId, "categories"] as const;

export function useCategories(widgetId: number) {
  return useQuery({
    queryKey: categoriesKey(widgetId),
    queryFn: () => categoryApi.list(widgetId),
    enabled: Number.isFinite(widgetId) && widgetId > 0,
    staleTime: 60 * 1000,
  });
}

export function useCreateCategory(widgetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => categoryApi.create(widgetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey(widgetId) });
      toast.success("Category created");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to create category");
    },
  });
}

/** Creates several categories in order (used for the guide starter set). */
export function useCreateStarterCategories(widgetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payloads: CreateCategoryPayload[]) => {
      const created = [];
      for (const payload of payloads) {
        created.push(await categoryApi.create(widgetId, payload));
      }
      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: categoriesKey(widgetId) });
      toast.success(
        created.length === 1
          ? "Category created"
          : `${created.length} categories added`
      );
    },
    onError: (err: AxiosError<{ message: string }>) => {
      queryClient.invalidateQueries({ queryKey: categoriesKey(widgetId) });
      toast.error(err.response?.data?.message ?? "Failed to add starter categories");
    },
  });
}

export function useUpdateCategory(widgetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCategoryPayload }) =>
      categoryApi.update(widgetId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey(widgetId) });
      toast.success("Category saved");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to save category");
    },
  });
}

export function useDeleteCategory(widgetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoryApi.delete(widgetId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey(widgetId) });
      toast.success("Category deleted");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to delete category");
    },
  });
}

export function useReorderCategories(widgetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => categoryApi.reorder(widgetId, orderedIds),
    onSuccess: (categories) => {
      queryClient.setQueryData(categoriesKey(widgetId), categories);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to reorder categories");
    },
  });
}
