"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, HardDrive, Users, Zap, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DownloadPDFButton } from "./DownloadPDFButton";
import { TTSAudioPlayer } from "@/features/tts/components/TTSAudioPlayer";
import { historyApi } from "../api/history.api";
import { downloadTranscriptionPDF } from "../utils/pdf";
import type { TranscriptionRecord } from "../types/history.types";

function fmtDuration(s: string) {
  const sec = parseFloat(s);
  if (!sec || isNaN(sec)) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function fmtTimestamp(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(str: string) {
  return new Date(str).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const statusStyles: Record<string, string> = {
  completed: "border-green-500/30 text-green-500 bg-green-500/10",
  processing: "border-blue-500/30 text-blue-500 bg-blue-500/10",
  failed: "border-red-500/30 text-red-500 bg-red-500/10",
  pending: "border-yellow-500/30 text-yellow-500 bg-yellow-500/10",
};

const statusLabels: Record<string, string> = {
  completed: "Completed",
  processing: "In Progress",
  failed: "Failed",
  pending: "Pending",
};

function getAudioType(data: TranscriptionRecord) {
  if (data.is_meeting) return "Meeting";
  if (data.audio_type === "realtime" || data.audio_type === "real-time") return "Real-time";
  return "Asynchronous";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

type LeftTab = "transcription" | "json";
type SubTab = "diarization" | "raw";

export function TranscriptionDetail({ id }: { id: number }) {
  const router = useRouter();
  const [leftTab, setLeftTab] = useState<LeftTab>("transcription");
  const [subTab, setSubTab] = useState<SubTab>("diarization");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["history", "transcription", "detail", id],
    queryFn: () => historyApi.getTranscription(id),
  });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-112px)] flex flex-col gap-4">
        <Skeleton className="h-10 w-64 flex-shrink-0" />
        <div className="flex flex-1 min-h-0 gap-4">
          <Skeleton className="flex-1 rounded-xl" />
          <Skeleton className="w-96 rounded-xl flex-shrink-0" />
        </div>
        <Skeleton className="h-14 w-full flex-shrink-0 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <p className="text-muted-foreground text-sm">Failed to load transcription.</p>
      </div>
    );
  }

  const name = data.original_filename || data.filename;
  const hasDiarization = data.timestamp?.length > 0;
  const activeSubTab: SubTab = hasDiarization ? subTab : "raw";

  return (
    <div className="h-[calc(100vh-112px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -ml-2 flex-shrink-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">{name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            variant="outline"
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              statusStyles[data.processing_status] ?? statusStyles.pending
            }`}
          >
            {statusLabels[data.processing_status] ?? data.processing_status}
          </Badge>
          <DownloadPDFButton onDownload={() => downloadTranscriptionPDF(data)} />
        </div>
      </div>

      {/* Two-column content */}
      <div className="flex flex-1 min-h-0 border rounded-xl overflow-hidden">
        {/* Left: transcription */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top tab bar */}
          <div className="flex items-center gap-0 border-b flex-shrink-0 px-5">
            {(["transcription", "json"] as LeftTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={`relative px-3 py-3 text-sm capitalize transition-colors ${
                  leftTab === t
                    ? "text-foreground font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "transcription" ? "Transcription" : "JSON"}
              </button>
            ))}
          </div>

          {leftTab === "transcription" && (
            <>
              {/* Sub-tab bar (diarization / raw) — only when timestamps exist */}
              {hasDiarization && (
                <div className="flex items-center gap-1 px-5 pt-3 pb-0 flex-shrink-0">
                  {(["diarization", "raw"] as SubTab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSubTab(t)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        activeSubTab === t
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "diarization" ? "Diarization" : "Raw"}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {activeSubTab === "diarization" && hasDiarization ? (
                  <div className="space-y-4">
                    {data.timestamp.map((t) => (
                      <div key={t.index} className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {fmtTimestamp(t.start)}
                          <span className="mx-1.5">•</span>
                          {t.speaker}
                        </p>
                        <p className="text-sm leading-relaxed">{t.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {data.transcription || (
                      <span className="text-muted-foreground italic">
                        No transcription available.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </>
          )}

          {leftTab === "json" && (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <pre className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap break-all font-mono">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right: info panel */}
        <div className="w-96 flex-shrink-0 border-l overflow-y-auto">
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Informations
            </p>
          </div>

          <div className="px-5 pb-5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Output
            </p>

            <div className="flex flex-col gap-0 divide-y">
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    statusStyles[data.processing_status] ?? statusStyles.pending
                  }`}
                >
                  {statusLabels[data.processing_status] ?? data.processing_status}
                </Badge>
              </div>

              <div className="flex flex-col gap-0.5 py-3">
                <span className="text-xs text-muted-foreground">Date</span>
                <span className="text-sm font-medium">{fmtDate(data.created_at)}</span>
              </div>

              <div className="flex flex-col gap-0.5 py-3">
                <span className="text-xs text-muted-foreground">Audio duration</span>
                <span className="text-sm font-medium tabular-nums">
                  {fmtDuration(data.duration_in_seconds)}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 py-3">
                <span className="text-xs text-muted-foreground">File size</span>
                <span className="text-sm font-medium">{fmtFileSize(data.file_size)}</span>
              </div>

              {data.num_speakers > 0 && (
                <div className="flex flex-col gap-0.5 py-3">
                  <span className="text-xs text-muted-foreground">Speakers</span>
                  <span className="text-sm font-medium">{data.num_speakers}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-5 mb-1">
              Input
            </p>

            <div className="flex flex-col gap-0 divide-y">
              <div className="flex flex-col gap-0.5 py-3">
                <span className="text-xs text-muted-foreground">Type</span>
                <span className="text-sm font-medium">{getAudioType(data)}</span>
              </div>

              <div className="flex flex-col gap-0.5 py-3">
                <span className="text-xs text-muted-foreground">Tokens used</span>
                <span className="text-sm font-medium tabular-nums">
                  {parseFloat(data.tokens_used).toFixed(0)}
                </span>
              </div>

              {data.audio_url && (
                <div className="flex flex-col gap-0.5 py-3">
                  <span className="text-xs text-muted-foreground">Audio URL</span>
                  <a
                    href={data.audio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary truncate hover:underline"
                  >
                    {data.audio_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom audio player */}
      {data.audio_url && (
        <div className="flex-shrink-0 pt-3">
          <TTSAudioPlayer src={data.audio_url} className="w-full" />
        </div>
      )}
    </div>
  );
}
