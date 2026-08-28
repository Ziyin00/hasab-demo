import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { channelLimitApi } from "../api/channel-limit.api";

export const CHANNEL_LIMIT_KEY = ["chat-platform", "channel-limit"] as const;

export function useChannelLimit() {
  const authenticated = useAuthStore((s) => s.authenticated);
  return useQuery({
    queryKey: CHANNEL_LIMIT_KEY,
    queryFn: channelLimitApi.get,
    staleTime: 60 * 1000,
    enabled: authenticated,
  });
}

export function useInvalidateChannelLimit() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CHANNEL_LIMIT_KEY });
}

export function canCreateChannel(limit?: {
  remaining: number;
} | null): boolean {
  if (!limit) return true;
  return limit.remaining > 0;
}
