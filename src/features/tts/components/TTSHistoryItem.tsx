"use client";

import { useRef, useState } from "react";
import { Play, Pause, Trash2, Download, RotateCcw } from "lucide-react";
import { useTTSStore } from "@/store/tts.store";
import type { TTSHistoryRecord } from "../types/tts.types";

interface TTSHistoryItemProps {
  record: TTSHistoryRecord;
  onDelete: (id: number) => void;
}

function formatTime(dateStr: string) {
  return new Date(dateStr)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

export function TTSHistoryItem({ record, onDelete }: TTSHistoryItemProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const setText = useTTSStore((s) => s.setText);

  const canPlay = record.status === "success" && !!record.audio_url;

  const togglePlay = () => {
    if (!canPlay) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(record.audio_url);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!record.audio_url) return;
    const a = document.createElement("a");
    a.href = record.audio_url;
    a.download = `speech-${record.id}.mp3`;
    a.click();
  };

  const handleReuse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setText(record.text);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onDelete(record.id);
  };

  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 group cursor-pointer transition-colors">
      <button
        onClick={togglePlay}
        disabled={!canPlay}
        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 hover:bg-muted/80 disabled:opacity-40 transition-colors"
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0" onClick={togglePlay}>
        <p className="text-sm truncate">{record.text}</p>
        <p className="text-xs text-muted-foreground">
          {record.speaker_name} · {formatTime(record.created_at)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:text-destructive text-muted-foreground transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleReuse}
          className="p-1 rounded hover:text-foreground text-muted-foreground transition-colors"
          title="Copy text to editor"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDownload}
          disabled={!canPlay}
          className="p-1 rounded hover:text-foreground text-muted-foreground disabled:opacity-30 transition-colors"
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
