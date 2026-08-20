"use client";

import { useQuery } from "@tanstack/react-query";
import { apikeyApi } from "../api/apikey.api";

export const HASAB_API_KEY_STORAGE = "hasab_api_test_key";
export const HASAB_API_KEY_QUERY = ["hasab-api-key"] as const;

function readStoredKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(HASAB_API_KEY_STORAGE)?.trim() ?? "";
}

/**
 * Account Hasab API key for context / chat / STT portal tools.
 * Fetches from the account API on any page that needs it (Contexts no longer
 * depends on visiting API Keys first). Seeds from localStorage when present.
 */
export function useHasabApiKey() {
  const query = useQuery({
    queryKey: HASAB_API_KEY_QUERY,
    queryFn: async () => {
      const key = await apikeyApi.getApiKey();
      localStorage.setItem(HASAB_API_KEY_STORAGE, key);
      return key;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
    initialData: () => {
      const stored = readStoredKey();
      return stored || undefined;
    },
    // Force a background refresh even when localStorage seeded the cache
    initialDataUpdatedAt: 0,
  });

  const apiKey = (query.data ?? "").trim();

  return {
    apiKey,
    isLoading: !apiKey && (query.isLoading || query.isFetching),
    isError: query.isError && !apiKey,
    refetch: query.refetch,
  };
}
