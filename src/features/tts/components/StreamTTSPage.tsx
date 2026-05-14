"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Play, Square } from "lucide-react";
import { apiClient } from "@/lib/api-client";

// --- PCM → WAV helpers ---

function buildWavHeader(
  pcmByteLength: number,
  sampleRate: number,
  numChannels: number,
  bitDepth: number
): ArrayBuffer {
  const blockAlign = numChannels * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  const write = (offset: number, value: number, size: 2 | 4) => {
    if (size === 4) view.setUint32(offset, value, true);
    else view.setUint16(offset, value, true);
  };
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  write(4, 36 + pcmByteLength, 4);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  write(16, 16, 4);
  write(20, 1, 2);
  write(22, numChannels, 2);
  write(24, sampleRate, 4);
  write(28, byteRate, 4);
  write(30, blockAlign, 2);
  write(34, bitDepth, 2);
  writeStr(36, "data");
  write(40, pcmByteLength, 4);

  return buffer;
}

function pcmChunksToWavBlob(
  chunks: ArrayBuffer[],
  sampleRate: number,
  numChannels: number,
  bitDepth: number
): Blob {
  const totalBytes = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const header = buildWavHeader(totalBytes, sampleRate, numChannels, bitDepth);
  return new Blob([header, ...chunks], { type: "audio/wav" });
}

// --- Constants ---

const LANGUAGES = [
  { label: "Amharic (አማርኛ)", value: "amh" },
  { label: "Oromo (Afaan Oromoo)", value: "orm" },
];

const SPEAKERS: Record<string, string[]> = {
  amh: ["Selam", "Aster", "Hanna", "Yared", "Haile", "Tigist"],
  orm: ["Lemlem"],
};

type StreamStatus = "idle" | "connecting" | "streaming" | "completed" | "error";

interface AudioInfo {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

// --- Component ---

export function StreamTTSPage() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("amh");
  const [speaker, setSpeaker] = useState(SPEAKERS["amh"][0]);
  const [sampleRate, setSampleRate] = useState("16000");

  const [status, setStatus] = useState<StreamStatus>("idle");
  const statusRef = useRef<StreamStatus>("idle");
  const setStatusSync = (s: StreamStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const [streamingStatus, setStreamingStatus] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [error, setError] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const pcmChunksRef = useRef<ArrayBuffer[]>([]);
  const audioInfoRef = useRef<AudioInfo>({ sampleRate: 24000, channels: 1, bitDepth: 16 });
  const startTimeRef = useRef<number | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isStreaming = status === "streaming" || status === "connecting";

  // Reset speaker when language changes
  useEffect(() => {
    setSpeaker(SPEAKERS[language]?.[0] ?? "");
  }, [language]);

  const finishStream = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const { sampleRate: sr, channels, bitDepth } = audioInfoRef.current;
    const totalPcmBytes = pcmChunksRef.current.reduce((s, c) => s + c.byteLength, 0);
    const duration = totalPcmBytes / (sr * channels * (bitDepth / 8));

    const wavBlob = pcmChunksToWavBlob(
      pcmChunksRef.current,
      sr,
      channels,
      bitDepth
    );
    const url = URL.createObjectURL(wavBlob);

    setAudioUrl(url);
    setAudioDuration(duration);
    setStatusSync("completed");
    setStreamingStatus("Complete! Final audio ready in player");

    const processingTime = startTimeRef.current
      ? (Date.now() - startTimeRef.current) / 1000
      : undefined;

    try {
      await apiClient.post("/tts/stream/complete", {
        request_id: requestIdRef.current,
        text: text.trim(),
        language,
        speaker_name: speaker,
        tts_type: "regular",
        audio_duration: duration,
        ...(processingTime !== undefined && { processing_time: processingTime }),
      });
    } catch {
      // non-critical
    }
  }, [text, language, speaker]);

  const handleWsError = useCallback((msg: string) => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setStatusSync("error");
    setError(msg);
    setStreamingStatus("");
  }, []);

  const handleStart = async () => {
    if (!text.trim()) return;

    setStatusSync("connecting");
    setAudioUrl(null);
    setAudioDuration(null);
    setError("");
    setStreamingStatus("Connecting...");
    pcmChunksRef.current = [];

    try {
      const res = await apiClient.post<{
        websocket_url: string;
        payload: unknown;
        request_id: string;
      }>("/tts/stream", {
        text: text.trim(),
        language,
        speaker_name: speaker || "Selam",
        sample_rate: parseInt(sampleRate, 10) || 24000,
      });

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      nextStartTimeRef.current = 0;

      const { websocket_url: rawWsUrl, payload, request_id } = res.data;
      requestIdRef.current = request_id;

      const wsUrl = rawWsUrl
        .replace(/(\/ws\/audio\/speech)\1$/, "$1")
        .replace(/^ws:\/\//, "wss://");

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        setStatusSync("streaming");
        startTimeRef.current = Date.now();
        setStreamingStatus("Connected. Streaming audio...");
        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event: MessageEvent) => {
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data) as {
              type: string;
              sample_rate?: number;
              channels?: number;
              bit_depth?: number;
              message?: string;
            };
            if (msg.type === "start") {
              audioInfoRef.current = {
                sampleRate: msg.sample_rate ?? (parseInt(sampleRate, 10) || 24000),
                channels: msg.channels ?? 1,
                bitDepth: msg.bit_depth ?? 16,
              };
            } else if (msg.type === "end") {
              finishStream();
            } else if (msg.type === "error") {
              handleWsError(msg.message ?? "TTS engine error");
            }
          } catch {
            // non-JSON text frame, ignore
          }
        } else {
          const chunk = event.data as ArrayBuffer;
          pcmChunksRef.current.push(chunk);

          if (audioCtxRef.current && audioInfoRef.current) {
            const { sampleRate: sr, channels } = audioInfoRef.current;
            const pcmData = new Int16Array(chunk);
            const float32Data = new Float32Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
              float32Data[i] = pcmData[i] / 32768.0;
            }

            const audioBuffer = audioCtxRef.current.createBuffer(
              channels || 1,
              float32Data.length,
              sr || 24000
            );
            audioBuffer.getChannelData(0).set(float32Data);

            const source = audioCtxRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtxRef.current.destination);

            const now = audioCtxRef.current.currentTime;
            if (nextStartTimeRef.current < now) {
              nextStartTimeRef.current = now + 0.05;
            }
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
          }
        }
      };

      ws.onerror = () => handleWsError("WebSocket connection error");

      ws.onclose = (e: CloseEvent) => {
        const s = statusRef.current;
        if (s === "streaming" && pcmChunksRef.current.length > 0) {
          finishStream();
        } else if (s !== "completed" && s !== "error") {
          handleWsError(`Connection closed (code ${e.code})`);
        }
      };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const msg =
        axiosErr.response?.status === 402
          ? "Insufficient balance. Please top up your account."
          : axiosErr.response?.data?.message ?? axiosErr.message ?? "Failed to start session.";
      setStatusSync("error");
      setError(msg);
      setStreamingStatus("");
    }
  };

  const handleStop = () => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setStatusSync("idle");
    setStreamingStatus("");
  };

  const availableSpeakers = SPEAKERS[language] ?? [];

  return (
    <div className="w-full">
      <Card className="border shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Text area */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{text.length} characters</span>
              <span>Max: 5000</span>
            </div>
            <Textarea
              placeholder="Type or paste your text here..."
              className="min-h-[140px] resize-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isStreaming}
              maxLength={5000}
            />
          </div>

          {/* Settings grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled={isStreaming}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Speaker Voice</Label>
              <Select value={speaker} onValueChange={setSpeaker} disabled={isStreaming}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSpeakers.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sample Rate (Hz)</Label>
              <Select value={sampleRate} onValueChange={setSampleRate} disabled={isStreaming}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8000">8000 Hz</SelectItem>
                  <SelectItem value="16000">16000 Hz</SelectItem>
                  <SelectItem value="21500">21500 Hz</SelectItem>
                  <SelectItem value="24000">24000 Hz</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Status */}
          {streamingStatus && (
            <div className="p-3 border rounded-lg bg-muted/40">
              <p className="text-sm text-muted-foreground">{streamingStatus}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1 h-12 text-sm font-medium"
              onClick={handleStart}
              disabled={isStreaming || !text.trim()}
            >
              {isStreaming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {status === "connecting" ? "Connecting..." : "Generating..."}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Generate Speech
                </>
              )}
            </Button>
            {isStreaming && (
              <Button variant="destructive" className="h-12 px-5" onClick={handleStop}>
                <Square className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Audio player */}
          {audioUrl && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Audio Player</h3>
                {audioDuration !== null && (
                  <span className="text-xs text-muted-foreground">
                    {audioDuration.toFixed(2)}s
                  </span>
                )}
              </div>
              <div className="bg-muted/40 p-3 rounded-lg border">
                <audio ref={audioRef} src={audioUrl} controls className="w-full" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
