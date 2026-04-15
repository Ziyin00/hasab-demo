"use client";

import { HistoryList } from "@/features/history/components/HistoryList";
import { useHistoryQuery } from "@/features/history/hooks/useHistoryQuery";
import { PageHeader } from "@/components/common/PageHeader";

export default function HistoryPage() {
  const { data: items = [], isLoading } = useHistoryQuery();

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader 
        title="Processing History" 
        description="View and download your previous jobs" 
      />
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <HistoryList items={items} />
      )}
    </div>
  );
}
