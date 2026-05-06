import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: analyticsApi.getAnalytics,
    staleTime: 1000 * 60 * 5,
  });
}
