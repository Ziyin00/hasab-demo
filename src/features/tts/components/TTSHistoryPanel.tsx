"use client";

import { useEffect } from "react";
import { Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTTSHistory } from "../hooks/useTTSHistory";
import { TTSHistoryItem } from "./TTSHistoryItem";
import type { TTSHistoryRecord } from "../types/tts.types";

function ordinal(n: number) {
  if (n >= 11 && n <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.toLocaleString("en-US", { month: "long" });
  return `${month} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
}

function groupByDate(records: TTSHistoryRecord[]) {
  const map = new Map<string, TTSHistoryRecord[]>();
  for (const r of records) {
    const key = new Date(r.created_at).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}

export function TTSHistoryPanel() {
  const { history, isLoadingHistory, hasMore, fetchHistory, loadMore, deleteRecord } =
    useTTSHistory();

  useEffect(() => {
    fetchHistory();
  }, []);

  if (isLoadingHistory && history.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Loading history...</span>
      </div>
    );
  }

  if (!isLoadingHistory && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
        <Clock className="h-8 w-8 opacity-25" />
        <p className="text-sm">No history yet</p>
      </div>
    );
  }

  const groups = groupByDate(history);

  return (
    <div className="overflow-y-auto h-full">
      <div className="px-3 py-3 space-y-4">
        {Array.from(groups.entries()).map(([dateKey, records]) => (
          <div key={dateKey}>
            <p className="text-xs font-semibold px-2 pb-1.5">
              {formatDateHeader(records[0].created_at)}
            </p>
            <div>
              {records.map((record) => (
                <TTSHistoryItem key={record.id} record={record} onDelete={deleteRecord} />
              ))}
            </div>
          </div>
        ))}

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={loadMore}
            disabled={isLoadingHistory}
          >
            {isLoadingHistory && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Load more
          </Button>
        )}
      </div>
    </div>
  );
}
