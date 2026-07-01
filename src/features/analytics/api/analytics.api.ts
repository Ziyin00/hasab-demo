import { apiClient } from "@/lib/api-client";
import type { AnalyticsData, AnalyticsRange } from "../types/analytics.types";

export const analyticsApi = {
  get: async (range: AnalyticsRange = "30d"): Promise<AnalyticsData> => {
    const r = await apiClient.get("/chat/analytics", { params: { range } });
    return r.data.data;
  },
};
