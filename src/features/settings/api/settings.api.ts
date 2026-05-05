import { apiClient } from "@/lib/api-client";
import type { ProfileResponse } from "@/types/api.types";
import type { TokenHistoryResponse, BuyTokensPayload, BuyTokensResponse } from "../types/billing.types";

export interface UpdateProfilePayload {
  name: string;
  phone_number: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateOrganizationPayload {
  name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  website: string;
}

export const settingsApi = {
  getProfile: () =>
    apiClient
      .get<ProfileResponse>("/profile")
      .then((r) => r.data.data.user),

  updateProfile: (payload: UpdateProfilePayload) =>
    apiClient
      .put<ProfileResponse>("/profile", payload)
      .then((r) => r.data.data.user),

  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.put("/profile/password", payload),

  updateOrganization: (id: number, payload: UpdateOrganizationPayload) =>
    apiClient.put(`/organizations/${id}`, payload),

  getTokenHistory: (page: number) =>
    apiClient
      .get<TokenHistoryResponse>("/tokens/history", { params: { page } })
      .then((r) => r.data.data),

  buyTokens: (payload: BuyTokensPayload) =>
    apiClient
      .post<BuyTokensResponse>("/tokens/buy", payload)
      .then((r) => r.data.data),
};
