"use client";

import { ArrowLeft, Captions, Check, ChevronDown, Clock, Copy, Download, FileText, FileType2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EllipsisVerticalGlyph } from "./EllipsisVerticalGlyph";
import { TranscriptionDisplayOptionsPanel } from "./TranscriptionDisplayOptionsPanel";
import type { TranscriptGroupMode } from "../../types/transcription.types";
import type { RefObject } from "react";

export function TranscriptionWorkspaceToolbar({
  audioId,
  filename,
  onBack,
  isEditing,
  onIsEditingChange,
  copyRef,
  copied,
  copyOpen,
  onCopyToggle,
  onCopyTextOnly,
  onCopyWithTimestamps,
  downloadRef,
  downloadOpen,
  onDownloadToggle,
  onDownloadTxt,
  onDownloadSrt,
  onDownloadPdf,
  optionsRef,
  optionsOpen,
  onOptionsToggle,
  groupMode,
  onGroupModeChange,
  timeLimit,
  onTimeLimitChange,
  charLimit,
  onCharLimitChange,
  showSpeakers,
  onShowSpeakersChange,
}: {
  audioId: string;
  filename: string | null;
  onBack: () => void;
  isEditing: boolean;
  onIsEditingChange: (next: boolean) => void;
  copyRef: RefObject<HTMLDivElement | null>;
  copied: boolean;
  copyOpen: boolean;
  onCopyToggle: () => void;
  onCopyTextOnly: () => void;
  onCopyWithTimestamps: () => void;
  downloadRef: RefObject<HTMLDivElement | null>;
  downloadOpen: boolean;
  onDownloadToggle: () => void;
  onDownloadTxt: () => void;
  onDownloadSrt: () => void;
  onDownloadPdf: () => void;
  optionsRef: RefObject<HTMLDivElement | null>;
  optionsOpen: boolean;
  onOptionsToggle: () => void;
  groupMode: TranscriptGroupMode;
  onGroupModeChange: (mode: TranscriptGroupMode) => void;
  timeLimit: number;
  onTimeLimitChange: (value: number) => void;
  charLimit: number;
  onCharLimitChange: (value: number) => void;
  showSpeakers: boolean;
  onShowSpeakersChange: (value: boolean) => void;
}) {
  const title = filename || `Audio ${audioId}`;

  return (
    <div className="sticky top-0 z-20 flex shrink-0 flex-row flex-wrap items-center justify-between gap-2 backdrop-blur px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3 md:px-5 lg:gap-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5 lg:gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 touch-manipulation lg:size-10"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-[0.9375rem] md:text-base lg:text-lg" title={title}>
          {title}
        </span>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-2 sm:gap-x-2 lg:flex-nowrap lg:gap-x-2">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Switch id="edit-mode" checked={isEditing} onCheckedChange={(value) => onIsEditingChange(Boolean(value))} />
          <Label htmlFor="edit-mode" className="inline-flex cursor-pointer items-center gap-1.5" title="Edit">
            <Pencil className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden lg:inline">Edit</span>
          </Label>
        </div>

        <div ref={copyRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={copyOpen}
            onClick={onCopyToggle}
            className="inline-flex touch-manipulation items-center gap-1 rounded-md border border-border px-2 py-1 text-xs lg:px-2.5 lg:text-sm"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            <span className="hidden lg:inline">{copied ? "Copied" : "Copy"}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
          {copyOpen && (
            <div className="absolute right-0 z-50 mt-1.5 max-h-[min(60vh,18rem)] w-[min(13rem,calc(100vw-1.75rem))] overflow-y-auto overscroll-contain rounded-md border border-border bg-card p-1 shadow-lg sm:mt-2 sm:w-52">
              <button
                type="button"
                className="flex w-full items-center rounded px-2 py-1 text-left text-sm hover:bg-accent"
                onClick={onCopyTextOnly}
              >
                <Copy className="mr-2 h-4 w-4" />
                Text only
              </button>
              <button
                type="button"
                className="flex w-full items-center rounded px-2 py-1 text-left text-sm hover:bg-accent"
                onClick={onCopyWithTimestamps}
              >
                <Clock className="mr-2 h-4 w-4" />
                With timestamps
              </button>
            </div>
          )}
        </div>

        <div ref={downloadRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={downloadOpen}
            onClick={onDownloadToggle}
            className="inline-flex touch-manipulation items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs hover:bg-accent lg:px-2.5 lg:text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">Download</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
          {downloadOpen && (
            <div className="absolute right-0 z-50 mt-1.5 max-h-[min(65vh,20rem)] w-[min(14rem,calc(100vw-1.75rem))] overflow-y-auto overscroll-contain rounded-md border border-border bg-card p-1 shadow-lg sm:mt-2 sm:w-52">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={onDownloadTxt}
              >
                <FileText className="h-4 w-4 shrink-0 opacity-70" />
                Plain text (.txt)
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={onDownloadSrt}
              >
                <Captions className="h-4 w-4 shrink-0 opacity-70" />
                Subtitles (.srt)
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={onDownloadPdf}
              >
                <FileType2 className="h-4 w-4 shrink-0 opacity-70" />
                PDF (.pdf)
              </button>
            </div>
          )}
        </div>

        <div ref={optionsRef} className="relative">
          <button
            type="button"
            aria-label="Transcript display options"
            onClick={onOptionsToggle}
            className="inline-flex size-9 touch-manipulation items-center justify-center rounded-md border border-border bg-background hover:bg-accent lg:size-10"
          >
            <EllipsisVerticalGlyph className="h-4 w-4" />
          </button>
          {optionsOpen && (
            <TranscriptionDisplayOptionsPanel
              groupMode={groupMode}
              onGroupModeChange={onGroupModeChange}
              timeLimit={timeLimit}
              onTimeLimitChange={onTimeLimitChange}
              charLimit={charLimit}
              onCharLimitChange={onCharLimitChange}
              showSpeakers={showSpeakers}
              onShowSpeakersChange={onShowSpeakersChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
