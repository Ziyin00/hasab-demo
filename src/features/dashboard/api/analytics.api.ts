import { apiClient } from "@/lib/api-client";
import type { AnalyticsResponse } from "../types/analytics.types";

export const analyticsApi = {
  getAnalytics: () =>
    apiClient
      .get<AnalyticsResponse>("/analytics")
      .then((r) => r.data.data),
};
