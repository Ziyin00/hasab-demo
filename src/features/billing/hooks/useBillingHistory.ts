import { useQuery } from "@tanstack/react-query";
import { billingApi } from "../api/billing.api";

export function useBillingHistory(page: number) {
  return useQuery({
    queryKey: ["billing", "history", page],
    queryFn: () => billingApi.getHistory(page),
    placeholderData: (prev) => prev,
  });
}
