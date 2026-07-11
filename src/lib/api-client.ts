import axios, { type InternalAxiosRequestConfig } from "axios";

const v1Base = process.env.NEXT_PUBLIC_API_URL || "https://api.hasab.ai/api/v1";
const apiBase = v1Base.endsWith("/v1") ? v1Base.slice(0, -3) : v1Base.replace(/\/v\d+$/, "");

function injectAuth(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const tokensStr = localStorage.getItem("tokens");
  if (tokensStr) {
    try {
      const tokens = JSON.parse(tokensStr);
      if (tokens.access_token) {
        config.headers.Authorization = `Bearer ${tokens.access_token}`;
      }
    } catch {
      // ignore parse error
    }
  }
  return config;
}

export const apiClient = axios.create({
  baseURL: v1Base,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(injectAuth);

export const chatbotApiClient = axios.create({
  baseURL: apiBase,
  headers: { "Content-Type": "application/json" },
});

chatbotApiClient.interceptors.request.use(injectAuth);
