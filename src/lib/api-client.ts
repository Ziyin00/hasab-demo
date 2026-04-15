import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.hasab.ai/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const tokensStr = localStorage.getItem("tokens");
  if (tokensStr) {
    try {
      const tokens = JSON.parse(tokensStr);
      if (tokens.access_token) {
        config.headers.Authorization = `Bearer ${tokens.access_token}`;
      }
    } catch (e) {
      // Ignore parse error
    }
  }
  return config;
});
