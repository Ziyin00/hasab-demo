"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useTTSStore } from "@/store/tts.store";
import { ttsApi } from "../api/tts.api";
import type { TTSHistoryParams } from "../types/tts.types";

const HISTORY_LIMIT = 20;

export const useTTSHistory = () => {
  const {
    history,
    historyTotal,
    historyOffset,
    setHistory,
    appendHistory,
    setHistoryOffset,
    removeHistoryRecord,
    isLoadingHistory,
    setIsLoadingHistory,
  } = useTTSStore();

  const fetchHistory = useCallback(async (params?: TTSHistoryParams) => {
    setIsLoadingHistory(true);
    try {
      const data = await ttsApi.getHistory({ limit: HISTORY_LIMIT, offset: 0, ...params });
      setHistory(data.records, data.total);
      setHistoryOffset(0);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [setHistory, setHistoryOffset, setIsLoadingHistory]);

  const loadMore = useCallback(async () => {
    const nextOffset = historyOffset + HISTORY_LIMIT;
    if (nextOffset >= historyTotal) return;
    setIsLoadingHistory(true);
    try {
      const data = await ttsApi.getHistory({ limit: HISTORY_LIMIT, offset: nextOffset });
      appendHistory(data.records, data.total);
      setHistoryOffset(nextOffset);
    } catch {
      toast.error("Failed to load more history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyOffset, historyTotal, appendHistory, setHistoryOffset, setIsLoadingHistory]);

  const deleteRecord = useCallback(async (id: number) => {
    try {
      await ttsApi.deleteRecord(id);
      removeHistoryRecord(id);
      toast.success("Record deleted");
    } catch {
      toast.error("Failed to delete record");
    }
  }, [removeHistoryRecord]);

  return {
    history,
    historyTotal,
    isLoadingHistory,
    hasMore: historyOffset + HISTORY_LIMIT < historyTotal,
    fetchHistory,
    loadMore,
    deleteRecord,
  };
};
