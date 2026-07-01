import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api";
import type { AnalyticsRange } from "../types/analytics.types";

export function useAnalytics(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: ["analytics", range],
    queryFn: () => analyticsApi.get(range),
    staleTime: 5 * 60 * 1000,
  });
}
