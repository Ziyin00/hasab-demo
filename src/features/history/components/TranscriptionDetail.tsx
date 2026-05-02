"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, FileAudio, Clock, HardDrive, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { historyApi } from "../api/history.api";

function formatDuration(s: string) {
  const sec = parseFloat(s);
  if (!sec || isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const r = Math.floor(sec % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(str: string) {
  return new Date(str).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const statusStyles: Record<string, string> = {
  completed: "border-green-500/30 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
  processing: "border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  failed: "border-red-500/30 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
  pending: "border-gray-500/30 text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400",
};

export function TranscriptionDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["history", "transcription", "detail", id],
    queryFn: () => historyApi.getTranscription(id),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <p className="text-muted-foreground text-sm">Failed to load transcription.</p>
      </div>
    );
  }

  const name = data.original_filename || data.filename;
  const style = statusStyles[data.processing_status] ?? statusStyles.pending;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">{name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(data.created_at)}</p>
        </div>
        <Badge variant="outline" className={`text-xs px-2 ${style}`}>
          {data.processing_status}
        </Badge>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Clock, label: "Duration", value: formatDuration(data.duration_in_seconds) },
          { icon: HardDrive, label: "File Size", value: formatFileSize(data.file_size) },
          { icon: Users, label: "Speakers", value: String(data.num_speakers) },
          { icon: FileAudio, label: "Tokens Used", value: parseFloat(data.tokens_used).toFixed(0) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1.5 p-3 rounded-xl border bg-card">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{label}</span>
            </div>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Audio player */}
      {data.audio_url && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Audio
          </p>
          <audio controls src={data.audio_url} className="w-full h-10" />
        </div>
      )}

      {/* Transcription text */}
      {data.transcription && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Transcription
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.transcription}</p>
        </div>
      )}

      {/* Timestamps */}
      {data.timestamp?.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Timestamps
          </p>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {data.timestamp.map((t) => (
              <div key={t.index} className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground tabular-nums w-20 flex-shrink-0 pt-px">
                  {t.start.toFixed(2)}s – {t.end.toFixed(2)}s
                </span>
                <span className="text-xs text-muted-foreground w-20 flex-shrink-0 pt-px">
                  {t.speaker}
                </span>
                <span className="text-sm">{t.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
