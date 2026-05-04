import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apikeyApi } from "../api/apikey.api";

export function useApiKey() {
  return useQuery({
    queryKey: ["api-key"],
    queryFn: apikeyApi.getApiKey,
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apikeyApi.regenerateApiKey,
    onSuccess: (newKey) => {
      queryClient.setQueryData(["api-key"], newKey);
    },
  });
}
