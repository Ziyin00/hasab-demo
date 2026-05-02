import { useQuery } from "@tanstack/react-query";
import { historyApi } from "../api/history.api";

export function useTranslationHistory(page: number) {
  return useQuery({
    queryKey: ["history", "translation", page],
    queryFn: () => historyApi.getTranslations(page),
    placeholderData: (prev) => prev,
  });
}
