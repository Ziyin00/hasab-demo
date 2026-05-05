import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { accessApi } from "../api/access.api";

export function useContextAccess() {
  return useQuery({
    queryKey: ["context", "access"],
    queryFn: accessApi.getStatus,
  });
}

export function useRequestAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accessApi.requestAccess,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["context", "access"] });
      toast.success(data.message ?? "Access request submitted");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to submit request");
    },
  });
}
