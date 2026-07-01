"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DocumentList } from "./DocumentList";
import { QueryDialog } from "./QueryDialog";
import { useDeleteStore, useDocuments } from "../hooks/useRag";
import type { RagStore } from "../types/rag.types";
import { cn } from "@/lib/utils";

function StoreStats({ storeId }: { storeId: number }) {
  const { data: docs } = useDocuments(storeId, true);
  if (!docs) return null;
  const ready = docs.filter((d) => d.status === "ready").length;
  const pending = docs.filter((d) => d.status === "pending" || d.status === "processing").length;
  const failed = docs.filter((d) => d.status === "failed").length;
  return (
    <span className="text-xs text-muted-foreground shrink-0">
      {docs.length} doc{docs.length !== 1 ? "s" : ""}
      {ready > 0 && <span className="text-green-600 ml-1">· {ready} ready</span>}
      {pending > 0 && <span className="text-blue-500 ml-1">· {pending} processing</span>}
      {failed > 0 && <span className="text-destructive ml-1">· {failed} failed</span>}
    </span>
  );
}

interface StoreCardProps {
  store: RagStore;
}

export function StoreCard({ store }: StoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: deleteStore, isPending: deleting } = useDeleteStore();

  const handleDelete = () => {
    deleteStore(store.id, { onSuccess: () => setConfirmOpen(false) });
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header row */}
      <button
        className="flex items-center gap-3 w-full p-4 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Database className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{store.name}</p>
          {store.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{store.description}</p>
          )}
        </div>
        <StoreStats storeId={store.id} />
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded body */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-[900px]" : "max-h-0"
        )}
      >
        <div className="border-t p-4 space-y-4">
          <DocumentList storeId={store.id} />

          {/* Actions below document list */}
          <div className="flex items-center gap-2 pt-1 border-t">
            <QueryDialog storeId={store.id} storeName={store.name} />
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
              disabled={deleting}
              onClick={() => setConfirmOpen(true)}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete knowledge base
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete knowledge base?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete &quot;{store.name}&quot;, all its documents, chunks, and
            the linked chat context. This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
