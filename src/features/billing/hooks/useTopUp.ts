import { useMutation } from "@tanstack/react-query";
import { billingApi } from "../api/billing.api";

export function useTopUp() {
  return useMutation({
    mutationFn: billingApi.topUp,
  });
}
