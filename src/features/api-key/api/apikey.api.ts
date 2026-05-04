import { apiClient } from "@/lib/api-client";

interface ApiKeyResponse {
  status: string;
  data: { api_key: string };
  message: string;
  code: number;
}

export const apikeyApi = {
  getApiKey: () =>
    apiClient
      .get<ApiKeyResponse>("/api-key")
      .then((r) => r.data.data.api_key),

  regenerateApiKey: () =>
    apiClient
      .post<ApiKeyResponse>("/api-key/regenerate")
      .then((r) => r.data.data.api_key),
};
