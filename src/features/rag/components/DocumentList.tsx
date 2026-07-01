"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Upload,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments, useUploadDocument } from "../hooks/useRag";
import type { DocumentStatus, RagDocument } from "../types/rag.types";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: DocumentStatus }) {
  const map: Record<DocumentStatus, { label: string; icon: React.ReactNode; className: string }> = {
    ready: {
      label: "Ready",
      icon: <CheckCircle2 className="h-3 w-3" />,
      className: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    pending: {
      label: "Pending",
      icon: <Clock className="h-3 w-3" />,
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    },
    processing: {
      label: "Processing",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    failed: {
      label: "Failed",
      icon: <XCircle className="h-3 w-3" />,
      className: "bg-red-500/10 text-red-600 border-red-500/20",
    },
  };

  const config = map[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[11px] font-medium px-1.5 py-0.5 shrink-0", config.className)}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

function DocumentRow({ doc }: { doc: RagDocument }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/40">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate font-medium">{doc.original_name}</p>
        {doc.status === "failed" && doc.error_message && (
          <p className="text-xs text-destructive mt-0.5 truncate">{doc.error_message}</p>
        )}
        {doc.status === "ready" && doc.chunk_count > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">{doc.chunk_count} chunks indexed</p>
        )}
        {(doc.status === "pending" || doc.status === "processing") && (
          <p className="text-xs text-muted-foreground mt-0.5">Embedding in progress…</p>
        )}
      </div>
      <StatusBadge status={doc.status} />
    </div>
  );
}

interface DocumentListProps {
  storeId: number;
}

export function DocumentList({ storeId }: DocumentListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { data: documents, isLoading } = useDocuments(storeId);
  const { mutate: upload, isPending: uploading } = useUploadDocument(storeId);

  const uploadFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => upload(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "text/plain" || f.type === "application/pdf"
    );
    if (files.length) uploadFiles(files);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-3/4 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Document list */}
      {documents && documents.length > 0 && (
        <div className="space-y-0.5 rounded-lg border divide-y overflow-hidden">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {/* Drop zone / upload button */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">
              {dragging ? "Drop files here" : "Upload documents"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag &amp; drop or click — .txt and .pdf, max 20 MB each
            </p>
          </div>
        )}
      </div>

      {documents && documents.length === 0 && !uploading && (
        <p className="text-xs text-muted-foreground text-center -mt-1">
          Upload your first document to activate this knowledge base.
        </p>
      )}
    </div>
  );
}
