"use client";

import { Database } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateStoreDialog } from "./CreateStoreDialog";
import { StoreCard } from "./StoreCard";
import { useStores } from "../hooks/useRag";

export function RagPage() {
  const { data: stores, isLoading } = useStores();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload .txt or .pdf documents. Hasab AI retrieves relevant passages and injects
            them into chat automatically — no changes to your chat requests needed.
          </p>
        </div>
        <CreateStoreDialog />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : stores && stores.length > 0 ? (
        <div className="space-y-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Database className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">No knowledge bases yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Create a knowledge base, upload .txt or .pdf files, and Hasab AI will use
              them to answer chat messages. Documents are chunked and embedded automatically.
            </p>
          </div>
          <CreateStoreDialog />
        </div>
      )}
    </div>
  );
}
