"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TTSAudioPlayerProps {
  src: string;
  className?: string;
  onEnded?: () => void;
}

export function TTSAudioPlayer({ src, className, onEnded }: TTSAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded_ = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      onEnded?.();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded_);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded_);
    };
  }, [src, onEnded]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = "speech.mp3";
    a.click();
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0 rounded-full flex-shrink-0"
        onClick={toggle}
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5 ml-0.5" />
        )}
      </Button>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div
          className="relative h-1.5 bg-border rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleDownload}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
