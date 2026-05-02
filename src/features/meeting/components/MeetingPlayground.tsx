"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  AudioLines,
  ChevronDown,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { submitMeetingMinutesUpload } from "../api/meeting.api";
import { exportMeetingMinutesPdf, exportMeetingMinutesTxt } from "../utils/exportMeeting";
import { transcriptionApi } from "@/features/transcription/api/transcription.api";
import { useMeetingStore } from "@/store/meeting.store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TTSAudioPlayer } from "@/features/tts/components/TTSAudioPlayer";
import { cn } from "@/lib/utils";

const MAX_DURATION_SEC = 30 * 60;
const INPUT_ID = "meeting-audio-input";

const LANGUAGE_OPTIONS = [
  { value: "amh", label: "አማርኛ (Amharic)" },
  { value: "english", label: "English" },
] as const;

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MeetingPlayground() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [phase, setPhase] = useState<"idle" | "uploading" | "processing">("idle");
  const [pickError, setPickError] = useState<string | null>(null);

  const language = useMeetingStore((s) => s.language);
  const setLanguage = useMeetingStore((s) => s.setLanguage);
  const activeTab = useMeetingStore((s) => s.activeTab);
  const setActiveTab = useMeetingStore((s) => s.setActiveTab);
  const responseFetched = useMeetingStore((s) => s.responseFetched);
  const rawResponse = useMeetingStore((s) => s.rawResponse);
  const summaryText = useMeetingStore((s) => s.summaryText);
  const successMessage = useMeetingStore((s) => s.successMessage);
  const fileMeta = useMeetingStore((s) => s.file);
  const hydrateFromStorage = useMeetingStore((s) => s.hydrateFromStorage);
  const resetStore = useMeetingStore((s) => s.reset);
  const setFilePreview = useMeetingStore((s) => s.setFilePreview);
  const setFromUploadResult = useMeetingStore((s) => s.setFromUploadResult);
  const patchFile = useMeetingStore((s) => s.patchFile);

  useEffect(() => {
    document.title = "Playground · Meeting minutes";
  }, []);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!responseFetched || !fileMeta?.audioId || fileMeta.url) return;
    let cancelled = false;
    transcriptionApi
      .getAudioFileUrl(fileMeta.audioId)
      .then((url) => {
        if (cancelled || !url?.trim()) return;
        patchFile({ url: url.trim() });
      })
      .catch(() => {
        /* leave without playable url */
      });
    return () => {
      cancelled = true;
    };
  }, [responseFetched, fileMeta?.audioId, fileMeta?.url, patchFile]);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, []);

  const handleReset = useCallback(() => {
    revokeBlob();
    setLocalFile(null);
    setUploadPct(0);
    setPhase("idle");
    setPickError(null);
    resetStore();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [resetStore, revokeBlob]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const audio = new Audio();
    audio.src = url;
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        URL.revokeObjectURL(url);
        e.target.value = "";
        setPickError("Could not read this file’s duration. Try another format.");
        return;
      }
      if (audio.duration > MAX_DURATION_SEC) {
        URL.revokeObjectURL(url);
        e.target.value = "";
        setPickError(`Audio must be about ${MAX_DURATION_SEC / 60} minutes or shorter.`);
        return;
      }
      setPickError(null);
      revokeBlob();
      blobUrlRef.current = url;
      setBlobUrl(url);
      setLocalFile(f);
      setFilePreview({
        name: f.name,
        size: formatSize(f.size),
        type: f.type || "audio/*",
        url,
        s3Url: null,
        audioId: null,
      });
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      e.target.value = "";
      setPickError("Invalid or unsupported audio file.");
    };
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!localFile) throw new Error("NO_FILE");
      setPhase("uploading");
      setUploadPct(0);
      const result = await submitMeetingMinutesUpload({
        file: localFile,
        language,
        onUploadProgress: (p) => setUploadPct(p),
      });
      setPhase("processing");
      return result;
    },
    onSuccess: (data) => {
      setPhase("idle");
      setUploadPct(0);
      revokeBlob();
      blobUrlRef.current = null;
      setLocalFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const name = fileMeta?.name ?? "Recording";
      const size = fileMeta?.size ?? "—";
      const type = fileMeta?.type ?? "audio/*";
      setFromUploadResult({
        rawResponse: data.raw,
        summaryText: data.summary,
        successMessage: data.message ?? "Audio processed successfully.",
        file: {
          name,
          size,
          type,
          url: data.audioUrl,
          s3Url: data.s3Url || null,
          audioId: data.audioId,
        },
      });
    },
    onError: () => {
      setPhase("idle");
      setUploadPct(0);
    },
  });

  const playableUrl = fileMeta?.url ?? blobUrl;
  const busy = mutation.isPending;
  const showUploadOverlay = busy && phase === "uploading";
  const showProcessOverlay = busy && phase === "processing";

  const jsonPretty = useMemo(() => {
    try {
      return JSON.stringify(rawResponse ?? {}, null, 2);
    } catch {
      return "{}";
    }
  }, [rawResponse]);

  const errorMessage = mutation.error
    ? (() => {
        const err = mutation.error as { response?: { status?: number; data?: { message?: string } } };
        if (err?.response?.status === 402) {
          return "Insufficient balance. Top up your account to continue.";
        }
        if (typeof err?.response?.data?.message === "string") return err.response.data.message;
        if (mutation.error instanceof Error && mutation.error.message === "NO_FILE") {
          return "Choose an audio file first.";
        }
        return "Something went wrong. Please try again.";
      })()
    : null;

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      {!responseFetched ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="grid w-full max-w-xs gap-1.5 sm:ml-auto">
            <Label className="text-xs font-medium text-muted-foreground">Summary language</Label>
            <Select value={language} onValueChange={setLanguage} disabled={busy}>
              <SelectTrigger className="h-10 w-full cursor-pointer bg-background">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      <div className="w-full min-w-0 rounded-xl border border-border bg-card shadow-sm">
        {!responseFetched ? (
          <Card className="border-none shadow-none">
            <CardContent className="relative min-h-[min(60vh,520px)] p-0">
              {!fileMeta ? (
                <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
                  <div className="flex size-20 items-center justify-center rounded-full bg-foreground text-background">
                    <AudioLines className="size-10" aria-hidden />
                  </div>
                  <div className="max-w-lg space-y-2">
                    {pickError ? (
                      <Alert variant="destructive" className="text-left">
                        <AlertCircle className="size-4" />
                        <AlertTitle className="text-sm">Invalid file</AlertTitle>
                        <AlertDescription className="text-sm">{pickError}</AlertDescription>
                      </Alert>
                    ) : null}
                    <CardTitle className="text-2xl font-semibold">Upload meeting audio</CardTitle>
                    <CardDescription className="text-base">
                      We transcribe and summarize your recording into structured meeting minutes.
                    </CardDescription>
                    <p className="text-pretty text-xs text-muted-foreground sm:text-sm">
                      Supported: common audio formats (MP3, WAV, …). Maximum duration {MAX_DURATION_SEC / 60}{" "}
                      minutes.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className={cn(
                      "h-11 rounded-full px-8",
                      "bg-linear-to-br from-[#7C20D0] to-[#D020C9] text-white shadow-md hover:opacity-92",
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose audio file
                  </Button>
                  <input
                    ref={fileInputRef}
                    id={INPUT_ID}
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-6 px-4 py-8 sm:px-8">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      disabled={busy}
                      onClick={handleReset}
                      aria-label="Clear selection"
                    >
                      <X className="size-5" />
                    </Button>
                  </div>

                  {errorMessage ? (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertTitle className="text-sm">Unable to process</AlertTitle>
                      <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
                    </Alert>
                  ) : null}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AudioLines className="size-5 shrink-0 text-primary" aria-hidden />
                        <span className="truncate">{fileMeta.name}</span>
                      </CardTitle>
                      <CardDescription>
                        {fileMeta.size} · {fileMeta.type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {playableUrl ? (
                        <TTSAudioPlayer src={playableUrl} className="w-full" />
                      ) : (
                        <p className="text-sm text-muted-foreground">No preview URL (restore session or re-upload).</p>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      className={cn(
                        "h-11 min-w-48 rounded-full",
                        "bg-linear-to-br from-[#7C20D0] to-[#D020C9] text-white shadow-md hover:opacity-92",
                      )}
                      disabled={!localFile || busy}
                      onClick={() => mutation.mutate()}
                    >
                      {busy ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Working…
                        </>
                      ) : (
                        "Process meeting"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {showUploadOverlay ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl border border-border/60 bg-background/85 px-6 backdrop-blur-sm">
                  <Loader2 className="size-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Uploading to secure storage…</p>
                  {fileMeta?.name ? (
                    <p className="max-w-xs truncate text-xs text-muted-foreground">{fileMeta.name}</p>
                  ) : null}
                  <div className="h-2 w-64 max-w-[80vw] overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{uploadPct}%</p>
                </div>
              ) : null}

              {showProcessOverlay ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-background/85 px-6 backdrop-blur-sm">
                  <Loader2 className="size-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Transcribing & summarizing…</p>
                  <p className="max-w-sm text-center text-xs text-muted-foreground">
                    Long recordings can take several minutes. You can leave this page open.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v === "json" ? "json" : "summary")}
            className="w-full min-w-0"
          >
            <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 gap-2 sm:h-9"
                onClick={handleReset}
              >
                <ArrowLeft className="size-4 shrink-0" />
                New meeting
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg bg-muted/80 p-0.5 sm:flex sm:h-9 sm:w-auto">
                  <TabsTrigger value="summary" className="rounded-md px-3 text-sm">
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="json" className="rounded-md px-3 text-sm">
                    JSON
                  </TabsTrigger>
                </TabsList>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-10 gap-2 sm:h-9">
                      <Download className="size-4 shrink-0" />
                      Export
                      <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => exportMeetingMinutesPdf(summaryText, fileMeta?.name ?? "Meeting minutes")}
                    >
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => exportMeetingMinutesTxt(summaryText, fileMeta?.name ?? "Meeting minutes")}
                    >
                      Download TXT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-5">
              <p className="mb-4 text-pretty text-sm text-muted-foreground">
                {successMessage ?? "Here is what we extracted from your recording."}
              </p>

              <TabsContent value="summary" className="mt-0 space-y-6 outline-none">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Original audio</CardTitle>
                    <CardDescription className="flex flex-wrap gap-2">
                      <span>{fileMeta?.name}</span>
                      <span aria-hidden>·</span>
                      <span>{fileMeta?.size}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {playableUrl ? (
                      <TTSAudioPlayer src={playableUrl} className="w-full" />
                    ) : (
                      <p className="text-sm text-muted-foreground">Audio link expired or unavailable.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Meeting summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-none text-base leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {summaryText?.trim() ? summaryText : "_No summary text returned._"}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="json" className="mt-0 outline-none">
                <pre className="max-h-[min(70vh,640px)] overflow-auto rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed">
                  {jsonPretty}
                </pre>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
