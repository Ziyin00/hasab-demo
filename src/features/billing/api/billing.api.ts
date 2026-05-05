import { apiClient } from "@/lib/api-client";
import type { ProfileResponse } from "@/types/api.types";
import type { TokenTransactionPage, TopUpRequest, TopUpResponse } from "../types/billing.types";

export const billingApi = {
  getHistory: (page: number) =>
    apiClient
      .get<{ status: boolean; data: TokenTransactionPage }>("/tokens/history", { params: { page } })
      .then((r) => r.data.data),

  getTotalTokens: () =>
    apiClient
      .get<ProfileResponse>("/profile")
      .then((r) => r.data.data.user.total_tokens ?? 0),

  topUp: (body: TopUpRequest) =>
    apiClient
      .post<TopUpResponse>("/tokens/buy", body)
      .then((r) => r.data),
};
