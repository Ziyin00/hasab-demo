import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { ragApi } from "../api/rag.api";
import type { CreateStorePayload } from "../types/rag.types";

export function useStores() {
  return useQuery({
    queryKey: ["rag", "stores"],
    queryFn: ragApi.listStores,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStorePayload) => ragApi.createStore(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag", "stores"] });
      toast.success("Knowledge base created");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to create knowledge base");
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storeId: number) => ragApi.deleteStore(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag", "stores"] });
      toast.success("Knowledge base deleted");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to delete knowledge base");
    },
  });
}

export function useDocuments(storeId: number, enabled = true) {
  return useQuery({
    queryKey: ["rag", "documents", storeId],
    queryFn: () => ragApi.listDocuments(storeId),
    enabled,
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (!docs) return false;
      const hasPending = docs.some(
        (d) => d.status === "pending" || d.status === "processing"
      );
      return hasPending ? 2000 : false;
    },
  });
}

export function useUploadDocument(storeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => ragApi.uploadDocument(storeId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag", "documents", storeId] });
      queryClient.invalidateQueries({ queryKey: ["rag", "stores"] });
      toast.success("Document uploaded — processing...");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Upload failed");
    },
  });
}

export function useQueryStore(storeId: number) {
  return useMutation({
    mutationFn: ({ question, topK }: { question: string; topK?: number }) =>
      ragApi.queryStore(storeId, question, topK),
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Query failed");
    },
  });
}
