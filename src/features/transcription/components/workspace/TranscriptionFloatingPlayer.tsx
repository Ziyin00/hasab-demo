"use client";

import { useEffect, useState } from "react";
import type { MutableRefObject, SyntheticEvent } from "react";
import { ArrowLeftRight, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRANSCRIPT_PLAYBACK_RATES } from "../../constants/transcriptPlayback";
import { formatMmSs } from "../../utils/transcriptTimeFormat";

function SkipTenButton({
  direction,
  onClick,
  label,
  disabled,
}: {
  direction: "back" | "forward";
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  const Icon = direction === "back" ? RotateCcw : RotateCw;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-400 dark:hover:bg-zinc-700 sm:h-10 sm:w-10"
      )}
    >
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        <Icon className="absolute inset-0 m-auto h-full w-full text-current " strokeWidth={1.25} aria-hidden />
        <span className="relative z-10 translate-y-px text-[8px] font-bold leading-none tabular-nums tracking-tight sm:text-[9px]">
          10
        </span>
      </span>
    </button>
  );
}

export function TranscriptionFloatingPlayer({
  src,
  audioRef,
  onTimeUpdate,
}: {
  src: string;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  onTimeUpdate?: (time: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTimeLocal] = useState(0);
  const [rateIdx, setRateIdx] = useState(1);

  const normalizedSrc = typeof src === "string" ? src.trim() : "";
  const hasSrcProp = normalizedSrc.length > 0;
  const durationSafe = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const scrubMax = durationSafe > 0 ? durationSafe : 1;
  const scrubValue = durationSafe > 0 ? Math.min(currentTime, durationSafe) : currentTime;

  useEffect(() => {
    if (!hasSrcProp) return;
    queueMicrotask(() => {
      setPlaying(false);
      setCurrentTimeLocal(0);
      setDuration(0);
    });
  }, [hasSrcProp, normalizedSrc]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onMeta = () => setDuration(el.duration || 0);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("loadedmetadata", onMeta);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("loadedmetadata", onMeta);
    };
  }, [audioRef, src]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = TRANSCRIPT_PLAYBACK_RATES[rateIdx] ?? 1;
  }, [rateIdx, audioRef]);

  const handleAudioTimeUpdate = (e: SyntheticEvent<HTMLAudioElement>) => {
    const t = e.currentTarget.currentTime;
    setCurrentTimeLocal(t);
    onTimeUpdate?.(t);
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !hasSrcProp) return;
    if (el.paused) {
      el.play().catch(() => undefined);
    } else el.pause();
  };

  const skip = (delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    const maxT = duration > 0 ? duration : 1e9;
    const next = Math.max(0, Math.min(maxT, el.currentTime + delta));
    el.currentTime = next;
    setCurrentTimeLocal(next);
    onTimeUpdate?.(next);
  };

  const seekTo = (next: number) => {
    const el = audioRef.current;
    if (!el) return;
    const maxT = duration > 0 ? duration : el.duration || 1e9;
    const t = Math.max(0, Math.min(maxT, next));
    el.currentTime = t;
    setCurrentTimeLocal(t);
    onTimeUpdate?.(t);
  };

  const cycleRate = () => setRateIdx((i) => (i + 1) % TRANSCRIPT_PLAYBACK_RATES.length);

  return (
    <>
      <audio
        ref={audioRef}
        src={hasSrcProp ? normalizedSrc : undefined}
        preload="metadata"
        className="hidden"
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEmptied={() => {
          setPlaying(false);
          setCurrentTimeLocal(0);
          setDuration(0);
        }}
        onEnded={() => {
          setPlaying(false);
          if (durationSafe > 0) {
            setCurrentTimeLocal(durationSafe);
            onTimeUpdate?.(durationSafe);
          }
        }}
      />

      <div
        className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] left-1/2 z-40 w-[min(24rem,min(calc(100vw-1.25rem),94vw))] -translate-x-1/2 overflow-hidden rounded-[1.75rem] border border-neutral-200/95 bg-white/98 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/98 dark:shadow-[0_12px_48px_rgba(0,0,0,0.5)] sm:bottom-[max(1rem,env(safe-area-inset-bottom,0px))] sm:w-[min(26rem,min(calc(100vw-1.75rem),92vw))] md:bottom-6 md:w-[min(30rem,min(calc(100vw-2rem),90vw))] lg:bottom-8 lg:w-[min(34rem,min(calc(100vw-2.5rem),92vw))] xl:w-[min(38rem,94vw)]"
        role="region"
        aria-label="Audio playback"
      >
        <div className="flex items-center gap-2 px-2.5 py-3 sm:gap-2.5 sm:px-4 sm:py-3 sm:pt-3.5">
          <span className="min-w-[2.65rem] shrink-0 text-center text-[11px] font-medium tabular-nums tracking-tight text-neutral-500 dark:text-zinc-400 sm:text-xs">
            {formatMmSs(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={scrubMax}
            step={0.05}
            value={scrubValue}
            disabled={!hasSrcProp || !durationSafe}
            onChange={(e) => seekTo(Number(e.target.value))}
            className={cn(
              "h-2 min-w-0 flex-1 cursor-pointer rounded-full accent-neutral-950 disabled:cursor-not-allowed disabled:opacity-40 dark:accent-zinc-100",
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-950 dark:[&::-webkit-slider-thumb]:bg-zinc-100",
              "[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-neutral-950 dark:[&::-moz-range-thumb]:bg-zinc-100"
            )}
            aria-label="Seek audio position"
          />
          <span className="min-w-[2.65rem] shrink-0 text-center text-[11px] font-medium tabular-nums tracking-tight text-neutral-500 dark:text-zinc-400 sm:text-xs">
            {formatMmSs(durationSafe)}
          </span>
        </div>

        <div className="flex items-center justify-center gap-1 px-2 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3">
          <div
            className="mr-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-neutral-300 dark:text-zinc-600 sm:mr-1 sm:h-10 sm:w-10"
            aria-hidden
          >
            <ArrowLeftRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
          </div>
          <SkipTenButton
            direction="back"
            onClick={() => skip(-10)}
            label="Back 10 seconds"
            disabled={!hasSrcProp}
          />
          <button
            type="button"
            onClick={togglePlay}
            disabled={!hasSrcProp}
            className="mx-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white shadow-md transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-45 sm:h-13 sm:w-13 dark:bg-white dark:text-neutral-950 dark:hover:bg-zinc-200"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" />
            ) : (
              <Play className="ml-1 h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" />
            )}
          </button>
          <SkipTenButton
            direction="forward"
            onClick={() => skip(10)}
            label="Forward 10 seconds"
            disabled={!hasSrcProp}
          />
          <button
            type="button"
            onClick={cycleRate}
            disabled={!hasSrcProp}
            className="ml-0.5 min-w-10 shrink-0 rounded-full px-2 py-2 text-xs font-semibold tabular-nums text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-45 sm:ml-1 sm:min-w-11 sm:text-sm dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Playback speed"
          >
            {TRANSCRIPT_PLAYBACK_RATES[rateIdx]}x
          </button>
        </div>
      </div>
    </>
  );
}
