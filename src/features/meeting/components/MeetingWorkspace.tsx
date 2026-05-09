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

export function MeetingWorkspace({ audioId }: { audioId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meetingPdfExportRef = useRef<HTMLDivElement>(null);
  const pdfStampRef = useRef<HTMLSpanElement>(null);
  const [pdfExportBusy, setPdfExportBusy] = useState(false);

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



  const handleReset = useCallback(() => {
    resetStore();
    window.location.href = "/dashboard/playground/meeting-minutes";
  }, [resetStore]);

  const playableUrl = fileMeta?.url;

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

  if (!responseFetched || fileMeta?.audioId !== audioId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load meeting minutes result for this recording.
        </div>
      </div>
    );
  }

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
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="space-y-1 px-4 pt-5 pb-3 sm:px-6 sm:pb-4">
                <CardTitle className="text-base">Raw JSON</CardTitle>
                <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                  Full structured payload from processing.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-5 sm:px-6">
                <div
                  className={cn(
                    "max-h-[min(62svh,580px)] overflow-y-auto overscroll-contain rounded-md border border-border bg-muted/35 shadow-inner [-webkit-overflow-scrolling:touch]",
                    "sm:max-h-[min(72vh,680px)]",
                  )}
                >
                  <pre
                    className={cn(
                      "block min-w-0 w-full whitespace-pre-wrap break-words px-3 py-3 pb-[max(1.25rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))]",
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
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
