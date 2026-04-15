import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { HistoryItem } from "../types/history.types";

// Mock data for initial setup
const mockHistory: HistoryItem[] = [
  { id: "1", title: "Meeting with Clients", type: "transcription", status: "completed", createdAt: "2 hours ago" },
  { id: "2", title: "Marketing Video", type: "subtitles", status: "processing", createdAt: "15 mins ago" },
];

export const useHistoryQuery = () => {
  return useQuery({
    queryKey: queryKeys.history.all,
    queryFn: async () => {
      // simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockHistory;
    },
  });
};
