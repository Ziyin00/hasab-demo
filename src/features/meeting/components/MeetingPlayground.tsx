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
import { toast } from "sonner";

import { submitMeetingMinutesUpload } from "../api/meeting.api";
import {
  exportMeetingMinutesPdfFromElement,
  exportMeetingMinutesTxt,
} from "../utils/exportMeeting";
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

const SUMMARY_MARKDOWN_CLASS =
  "max-w-none min-w-0 text-[15px] leading-relaxed sm:text-base [&_a]:wrap-break-word [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] sm:[&_code]:text-[0.875em] [&_h1]:mt-5 [&_h1]:text-xl [&_h1]:font-bold sm:[&_h1]:mt-6 sm:[&_h1]:text-2xl [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold sm:[&_h2]:mt-5 sm:[&_h2]:text-xl [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold sm:[&_h3]:mt-4 sm:[&_h3]:text-lg [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 sm:[&_ol]:pl-6 [&_p]:my-3 [&_p]:wrap-break-word [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-2.5 sm:[&_pre]:p-3 [&_pre]:text-[13px] sm:[&_pre]:text-sm [&_table]:w-full [&_table]:min-w-0 [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 sm:[&_ul]:pl-6";

export function MeetingPlayground() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meetingPdfExportRef = useRef<HTMLDivElement>(null);
  const pdfStampRef = useRef<HTMLSpanElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [pdfExportBusy, setPdfExportBusy] = useState(false);
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

  const summaryMdBody = useMemo(() => {
    const s = summaryText?.trim();
    return s ? s : "_No summary text returned._";
  }, [summaryText]);

  const pdfHeadingTitle = useMemo(() => {
    const raw = fileMeta?.name?.trim();
    if (!raw) return "Meeting minutes";
    return raw.replace(/\.[^/.]+$/, "").trim() || raw;
  }, [fileMeta?.name]);

  const flushPaint = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

  const handleExportPdf = useCallback(async () => {
    const root = meetingPdfExportRef.current;
    if (!root) {
      toast.error("PDF export unavailable", { description: "Reload the page and try again." });
      return;
    }
    setPdfExportBusy(true);
    try {
      if (pdfStampRef.current) {
        pdfStampRef.current.textContent = new Intl.DateTimeFormat(undefined, {
          dateStyle: "long",
          timeStyle: "short",
        }).format(new Date());
      }
      await flushPaint();
      await exportMeetingMinutesPdfFromElement(root, fileMeta?.name ?? "Meeting minutes");
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF", {
        description: "Try TXT export or shorten the summary and retry.",
      });
    } finally {
      setPdfExportBusy(false);
    }
  }, [fileMeta?.name]);

  const handleExportTxt = useCallback(() => {
    try {
      exportMeetingMinutesTxt(summaryText ?? "", fileMeta?.name ?? "Meeting minutes");
      toast.success("Text file downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not download text file");
    }
  }, [fileMeta?.name, summaryText]);

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
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      {/* Off-screen DOM for PDF capture (fonts + Markdown match UI; works while JSON tab is active). */}
      {responseFetched ? (
        <div
          ref={meetingPdfExportRef}
          data-meeting-pdf-export-root
          className="fixed top-0 left-[-9999px] z-9999 w-[720px] bg-white px-10 pb-14 pt-10 text-[15px] leading-relaxed text-neutral-900 shadow-none"
          aria-hidden
        >
          <header className="mb-10 border-b border-neutral-200 pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Hasab AI
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">{pdfHeadingTitle}</h2>
            <p className="mt-2 min-h-4 text-xs text-neutral-500">
              <span ref={pdfStampRef} />
            </p>
          </header>
          <div
            className={`max-w-none text-neutral-900 [&_a]:text-violet-700 [&_a]:underline [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-neutral-900 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:rounded-lg [&_pre]:bg-neutral-100 [&_pre]:p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-200 [&_td]:p-2 [&_th]:border [&_th]:border-neutral-200 [&_th]:bg-neutral-100 [&_th]:p-2 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryMdBody}</ReactMarkdown>
          </div>
        </div>
      ) : null}

      {!responseFetched ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
          <div className="grid w-full gap-1.5 sm:ml-auto sm:max-w-xs">
            <Label htmlFor="meeting-summary-lang" className="text-xs font-medium text-muted-foreground">
              Summary language
            </Label>
            <Select value={language} onValueChange={setLanguage} disabled={busy}>
              <SelectTrigger
                id="meeting-summary-lang"
                className="h-11 w-full cursor-pointer touch-manipulation bg-background sm:h-10"
              >
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

      <div className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm sm:rounded-xl">
        {!responseFetched ? (
          <Card className="border-none shadow-none">
            <CardContent className="relative min-h-[min(52vh,480px)] sm:min-h-[min(60vh,520px)] p-0">
              {!fileMeta ? (
                <div className="flex flex-col items-center justify-center gap-5 px-4 py-12 text-center sm:gap-6 sm:px-6 sm:py-16">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-foreground text-background sm:size-20">
                    <AudioLines className="size-8 sm:size-10" aria-hidden />
                  </div>
                  <div className="max-w-lg space-y-2 px-1">
                    {pickError ? (
                      <Alert variant="destructive" className="text-left">
                        <AlertCircle className="size-4" />
                        <AlertTitle className="text-sm">Invalid file</AlertTitle>
                        <AlertDescription className="text-sm">{pickError}</AlertDescription>
                      </Alert>
                    ) : null}
                    <CardTitle className="text-pretty text-xl font-semibold tracking-tight sm:text-2xl">
                      Upload meeting audio
                    </CardTitle>
                    <CardDescription className="text-pretty text-sm sm:text-base">
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
                      "h-12 w-full max-w-xs touch-manipulation rounded-full px-8 sm:h-11 sm:w-auto",
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
                <div className="space-y-5 px-3 py-6 sm:space-y-6 sm:px-8 sm:py-8">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0 touch-manipulation rounded-full sm:size-10"
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

                  <Card className="overflow-hidden">
                    <CardHeader className="space-y-1">
                      <CardTitle className="flex items-start gap-2 text-base leading-snug sm:items-center sm:text-lg">
                        <AudioLines className="mt-0.5 size-5 shrink-0 text-primary sm:mt-0" aria-hidden />
                        <span className="min-w-0 wrap-break-word font-semibold sm:font-medium">
                          {fileMeta.name}
                        </span>
                      </CardTitle>
                      <CardDescription className="flex flex-wrap gap-x-2 gap-y-1 text-xs sm:text-sm">
                        <span>{fileMeta.size}</span>
                        <span className="text-muted-foreground/70" aria-hidden>
                          ·
                        </span>
                        <span className="break-all">{fileMeta.type}</span>
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

                  <div className="flex justify-center px-1">
                    <Button
                      type="button"
                      className={cn(
                        "h-12 w-full max-w-md touch-manipulation rounded-full sm:h-11 sm:min-w-48 sm:max-w-none sm:w-auto",
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
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg border border-border/60 bg-background/90 px-4 backdrop-blur-sm sm:rounded-xl sm:bg-background/85 sm:px-6">
                  <Loader2 className="size-9 animate-spin text-primary sm:size-10" />
                  <p className="text-center text-sm font-medium">Uploading to secure storage…</p>
                  {fileMeta?.name ? (
                    <p className="max-w-[min(100%,18rem)] wrap-break-word text-center text-xs text-muted-foreground sm:max-w-xs">
                      {fileMeta.name}
                    </p>
                  ) : null}
                  <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted sm:w-64">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{uploadPct}%</p>
                </div>
              ) : null}

              {showProcessOverlay ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg border border-border/60 bg-background/90 px-4 backdrop-blur-sm sm:rounded-xl sm:bg-background/85 sm:px-6">
                  <Loader2 className="size-9 animate-spin text-primary sm:size-10" />
                  <p className="text-center text-sm font-medium">Transcribing & summarizing…</p>
                  <p className="max-w-sm text-pretty px-1 text-center text-xs leading-relaxed text-muted-foreground">
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
            className="flex w-full min-w-0 flex-col gap-0"
          >
            <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 md:px-5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-11 shrink-0 justify-start gap-2 touch-manipulation px-3 sm:ml-0 sm:h-9 sm:justify-center sm:px-2"
                onClick={handleReset}
              >
                <ArrowLeft className="size-4 shrink-0" />
                New meeting
              </Button>
              <div className="flex min-w-0 flex-1 flex-row flex-nowrap items-center gap-2 sm:flex-wrap sm:justify-end">
                <TabsList className="grid h-11 min-h-11 min-w-0 flex-1 grid-cols-2 rounded-lg bg-muted/80 p-0.5 touch-manipulation sm:h-9 sm:w-auto sm:flex-initial sm:max-w-full">
                  <TabsTrigger
                    value="summary"
                    className="rounded-md px-2 text-sm touch-manipulation sm:px-3"
                    aria-label="Summary"
                  >
                    <span >Summary</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="json"
                    className="rounded-md px-2 text-sm touch-manipulation sm:px-3"
                    aria-label="JSON"
                  >
                    <span>JSON</span>
                  </TabsTrigger>
                </TabsList>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Export"
                      className="inline-flex size-11 shrink-0 touch-manipulation items-center justify-center gap-0 p-0 sm:h-9 sm:w-auto sm:justify-center sm:gap-2 sm:px-3"
                    >
                      <Download className="size-4 shrink-0 sm:hidden" aria-hidden />
                      <span className="hidden font-medium sm:inline">Export</span>
                      <ChevronDown className="hidden size-4 shrink-0 opacity-60 sm:inline" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      disabled={pdfExportBusy}
                      className="cursor-pointer gap-2"
                      onClick={(e) => {
                        e.preventDefault();
                        void handleExportPdf();
                      }}
                    >
                      {pdfExportBusy ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                      ) : (
                        <Download className="size-4 shrink-0 opacity-70" aria-hidden />
                      )}
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={pdfExportBusy}
                      className="cursor-pointer gap-2"
                      onClick={(e) => {
                        e.preventDefault();
                        handleExportTxt();
                      }}
                    >
                      <Download className="size-4 shrink-0 opacity-70" aria-hidden />
                      Download TXT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="min-w-0 px-3 py-4 pb-[max(1.5rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] pt-4 sm:p-4 sm:pb-4 md:p-5">
              <p className="mb-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-sm">
                {successMessage ?? "Here is what we extracted from your recording."}
              </p>

              <TabsContent value="summary" className="mt-0 min-w-0 space-y-4 outline-none sm:space-y-6">
                <Card className="overflow-hidden">
                  <CardHeader className="space-y-1 px-4 pt-5 pb-3 sm:px-6 sm:pb-4">
                    <CardTitle className="text-base">Original audio</CardTitle>
                    <CardDescription className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-0 sm:text-sm">
                      <span className="min-w-0 wrap-break-word font-medium text-foreground">{fileMeta?.name}</span>
                      <span className="hidden text-muted-foreground/70 sm:inline" aria-hidden>
                        ·
                      </span>
                      <span>{fileMeta?.size}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-5 sm:px-6">
                    {playableUrl ? (
                      <TTSAudioPlayer src={playableUrl} className="w-full min-w-0" />
                    ) : (
                      <p className="text-sm text-muted-foreground">Audio link expired or unavailable.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="px-4 pt-5 pb-2 sm:px-6">
                    <CardTitle className="text-base">Meeting summary</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-5 sm:px-6">
                    <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 sm:mx-0 sm:overflow-visible sm:px-0">
                      <div className={`text-foreground ${SUMMARY_MARKDOWN_CLASS}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryMdBody}</ReactMarkdown>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="json" className="mt-0 min-w-0 space-y-4 outline-none sm:space-y-6">
                <Card className="overflow-hidden">
                  <CardHeader className="space-y-1 px-4 pt-5 pb-3 sm:px-6 sm:pb-4">
                    <CardTitle className="text-base">Raw JSON</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                      Full structured payload from processing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-5 sm:px-6">
                    <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 sm:mx-0 sm:overflow-visible sm:px-0">
                      <div
                        className={cn(
                          "max-h-[min(62svh,580px)] overflow-auto overscroll-contain rounded-md border border-border bg-muted/35 shadow-inner [-webkit-overflow-scrolling:touch]",
                          "sm:max-h-[min(72vh,680px)]",
                        )}
                      >
                        <pre
                          className={cn(
                            "block min-w-full w-max whitespace-pre px-3 py-3 pb-[max(1.25rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))]",
                            "font-mono text-[12px] leading-relaxed tracking-normal text-foreground antialiased",
                            "sm:px-4 sm:py-4 sm:pb-4 sm:text-[13px] sm:leading-relaxed",
                          )}
                          tabIndex={0}
                          role="region"
                          aria-label="Raw JSON response from meeting processing"
                        >
                          {jsonPretty}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
