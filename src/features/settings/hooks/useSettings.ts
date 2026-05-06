import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  settingsApi,
  UpdateProfilePayload,
  ChangePasswordPayload,
  UpdateOrganizationPayload,
} from "../api/settings.api";
import type { BuyTokensPayload } from "../types/billing.types";

export type { UpdateProfilePayload, ChangePasswordPayload, UpdateOrganizationPayload };

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: settingsApi.getProfile,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => settingsApi.updateProfile(payload),
    onSuccess: (updatedUser) => {
      useAuthStore.setState({ user: updatedUser });
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => settingsApi.changePassword(payload),
  });
}

export function useTokenHistory(page: number) {
  return useQuery({
    queryKey: ["token-history", page],
    queryFn: () => settingsApi.getTokenHistory(page),
    placeholderData: (prev) => prev,
  });
}

export function useBuyTokens() {
  return useMutation({
    mutationFn: (payload: BuyTokensPayload) => settingsApi.buyTokens(payload),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) =>
      settingsApi.updateOrganization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
