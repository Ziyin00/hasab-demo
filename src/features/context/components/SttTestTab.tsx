"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Mic, Square, Upload, FileAudio, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { contextApi } from "../api/context.api";
import { LANGUAGE_OPTIONS } from "../types/context.types";

// ─── Audio utilities ──────────────────────────────────────────────────────────

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const len = buffer.length;
  const ch = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const ab = new ArrayBuffer(44 + len * ch * 2);
  const view = new DataView(ab);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF"); view.setUint32(4, 36 + len * ch * 2, true);
  str(8, "WAVE"); str(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, ch, true); view.setUint32(24, sr, true);
  view.setUint32(28, sr * ch * 2, true); view.setUint16(32, ch * 2, true);
  view.setUint16(34, 16, true); str(36, "data");
  view.setUint32(40, len * ch * 2, true);
  let offset = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return ab;
}

async function toWav(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const decoded = await ctx.decodeAudioData(e.target!.result as ArrayBuffer);
        resolve(new Blob([audioBufferToWav(decoded)], { type: "audio/wav" }));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

function bestMime(): string {
  const candidates = [
    "audio/ogg;codecs=opus", "audio/ogg",
    "audio/webm;codecs=opus", "audio/webm", "audio/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "audio/webm";
}

function fmtSecs(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props { apiKey: string; }

export function SttTestTab({ apiKey }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [inputSource, setInputSource] = useState<"upload" | "voice" | null>(null);
  const [language, setLanguage] = useState("en");
  const [result, setResult] = useState("");
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const langRef = useRef(language);

  useEffect(() => { langRef.current = language; }, [language]);

  const { mutate: transcribe, isPending, error, reset } = useMutation({
    mutationFn: () =>
      contextApi.transcribe(
        apiKey,
        file!,
        LANGUAGE_OPTIONS.find((o) => o.value === langRef.current)?.apiValue ?? "eng"
      ),
    onSuccess: (text) => setResult(text),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setInputSource(f ? "upload" : null);
    setResult("");
    reset();
  };

  const clearAll = () => {
    setFile(null);
    setInputSource(null);
    setResult("");
    reset();
  };

  const handleTranscribe = () => {
    if (!file) return;
    setResult("");
    reset();
    transcribe();
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = bestMime();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        let finalBlob = blob;
        try { finalBlob = await toWav(blob); } catch { /* use original */ }
        const voiceFile = new File([finalBlob], "recording.wav", { type: "audio/wav" });
        setFile(voiceFile);
        setInputSource("voice");
        setResult("");
        reset();
      };

      recorder.start();
      setRecording(true);
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
    } catch {
      setRecording(false);
    }
  };

  const apiError = error
    ? ((error as AxiosError<{ message: string }>).response?.data?.message ??
       (error as Error).message)
    : null;

  const fileSizeKb = file ? (file.size / 1024).toFixed(1) : null;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold">Speech-to-Text Test</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload an audio file or record directly from your microphone to test transcription.
        </p>
      </div>

      {/* Language */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Language
        </Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* ── File upload ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Upload File
          </p>
          <label
            className={`flex h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 cursor-pointer transition-colors ${
              inputSource === "upload" && file
                ? "border-primary/40 bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <Input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={recording || isPending}
            />
            {inputSource === "upload" && file ? (
              <>
                <FileAudio className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground truncate max-w-[140px]">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{fileSizeKb} KB</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground text-center">
                  Click to select audio file
                </p>
              </>
            )}
          </label>
        </div>

        {/* ── Voice record ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Record Voice
          </p>
          <div
            className={`flex h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 transition-colors ${
              recording
                ? "border-destructive/40 bg-destructive/5"
                : inputSource === "voice" && file
                  ? "border-primary/40 bg-primary/5"
                  : "border-border"
            }`}
          >
            {recording ? (
              <>
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isPending}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-white shadow-lg shadow-destructive/30 transition-all"
                >
                  <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-30" />
                  <Square className="h-4 w-4 fill-current" />
                </button>
                <div className="text-center">
                  <p className="text-sm font-semibold text-destructive tabular-nums">{fmtSecs(recSecs)}</p>
                  <p className="text-[10px] text-muted-foreground">Click to stop</p>
                </div>
              </>
            ) : inputSource === "voice" && file ? (
              <>
                <Mic className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">recording.wav</p>
                  <p className="text-[10px] text-muted-foreground">{fileSizeKb} KB</p>
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isPending || !apiKey}
                  className="text-[10px] text-primary hover:underline disabled:opacity-40"
                >
                  Re-record
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isPending || !apiKey}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-40"
                >
                  <Mic className="h-5 w-5" />
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Click to start recording
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shared transcribe button */}
      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2"
          onClick={handleTranscribe}
          disabled={!file || recording || isPending || !apiKey}
        >
          {isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Mic className="h-4 w-4" />
          }
          {isPending ? "Transcribing…" : "Transcribe"}
        </Button>
        {file && !recording && (
          <Button variant="outline" onClick={clearAll} disabled={isPending}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Transcription
          </Label>
          <Textarea
            rows={6}
            value={result}
            readOnly
            className="resize-none bg-muted/30 text-sm"
          />
        </div>
      )}
    </div>
  );
}
