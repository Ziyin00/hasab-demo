import { useQuery } from "@tanstack/react-query";
import { billingApi } from "../api/billing.api";

export function useTotalTokens() {
  return useQuery({
    queryKey: ["billing", "tokens"],
    queryFn: billingApi.getTotalTokens,
  });
}
