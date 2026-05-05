"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  FileAudio,
  ArrowRight,
} from "lucide-react";
import { useTranscriptionStore } from "@/store/transcription.store";
import { cn } from "@/lib/utils";

export function TranscriptionJobToast() {
  const { job, setJob } = useTranscriptionStore();
  const router = useRouter();

  // Auto-dismiss 8 seconds after reaching 'done'
  useEffect(() => {
    if (job?.phase !== "done") return;
    const t = setTimeout(() => setJob(null), 8000);
    return () => clearTimeout(t);
  }, [job?.phase, setJob]);

  if (!job) return null;

  const { phase, fileName, progress, audioId, error } = job;
  const isActive = phase === "uploading" || phase === "processing";

  const handleView = () => {
    if (audioId) router.push(`/dashboard/playground/transcription/${audioId}`);
    setJob(null);
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[200] w-80 rounded-xl border bg-card shadow-2xl",
        "animate-in fade-in slide-in-from-bottom-3 duration-300"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 py-3 border-b",
          phase === "done" ? "bg-green-500/5" : phase === "error" ? "bg-destructive/5" : "bg-muted/30"
        )}
      >
        {isActive && (
          <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
        )}
        {phase === "done" && (
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        )}
        {phase === "error" && (
          <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        )}

        <span className="text-sm font-semibold flex-1 leading-none">
          {phase === "uploading" && "Uploading…"}
          {phase === "processing" && "Transcribing…"}
          {phase === "done" && "Transcription ready"}
          {phase === "error" && "Processing failed"}
        </span>

        {!isActive && (
          <button
            onClick={() => setJob(null)}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 space-y-3">
        <div className="flex items-center gap-2">
          <FileAudio className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground truncate">{fileName}</p>
        </div>

        {phase === "uploading" && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading to server</span>
              <span className="font-mono tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {phase === "processing" && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            AI is transcribing your audio.
            <br />
            You can freely navigate to other pages.
          </p>
        )}

        {phase === "done" && audioId && (
          <button
            onClick={handleView}
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            View result <ArrowRight className="h-3 w-3" />
          </button>
        )}

        {phase === "done" && !audioId && (
          <p className="text-xs text-muted-foreground">
            Transcription complete. Refresh the page to view results.
          </p>
        )}

        {phase === "error" && (
          <p className="text-xs text-destructive leading-relaxed">
            {error ?? "An unexpected error occurred"}
          </p>
        )}
      </div>
    </div>
  );
}
