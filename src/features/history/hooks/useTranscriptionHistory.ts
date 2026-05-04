import { useQuery } from "@tanstack/react-query";
import { historyApi } from "../api/history.api";

export function useTranscriptionHistory(page: number) {
  return useQuery({
    queryKey: ["history", "transcription", page],
    queryFn: () => historyApi.getTranscriptions(page),
    placeholderData: (prev) => prev,
  });
}
