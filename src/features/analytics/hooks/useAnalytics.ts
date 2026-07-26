import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api";
import type { AnalyticsRange } from "../types/analytics.types";

export function useAnalytics(range: AnalyticsRange = "30d", chatbotWidgetId?: number) {
  return useQuery({
    queryKey: ["analytics", range, chatbotWidgetId],
    queryFn: () => analyticsApi.get(range, chatbotWidgetId),
    staleTime: 5 * 60 * 1000,
  });
}
