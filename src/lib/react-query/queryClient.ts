import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

/** Drop all cached server data — call on logout / account switch. */
export function clearAppQueryCache() {
  queryClient.clear();
}
