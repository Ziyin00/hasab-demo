"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DownloadPDFButton } from "./DownloadPDFButton";
import { downloadTranslationPDF } from "../utils/pdf";
import type { TranslationRecord } from "../types/history.types";

const LANG_NAMES: Record<string, string> = {
  amh: "Amharic",
  orm: "Oromo",
  eng: "English",
  fra: "French",
  ara: "Arabic",
  som: "Somali",
};

function langLabel(code: string) {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

function formatDate(str: string) {
  return new Date(str).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={handleCopy}>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

interface Props {
  record: TranslationRecord | null;
  open: boolean;
  onClose: () => void;
}

export function TranslationDrawer({ record, open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle>
            {record
              ? `${langLabel(record.source_language)} → ${langLabel(record.target_language)}`
              : ""}
          </SheetTitle>
          <SheetDescription>
            {record ? formatDate(record.created_at) : ""}
          </SheetDescription>
        </SheetHeader>

        {record && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{record.character_count.toLocaleString()} characters</span>
                {!record.success && (
                  <span className="text-red-500">Translation failed</span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {langLabel(record.source_language)}
                  </p>
                  <CopyButton text={record.source_text} />
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{record.source_text}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {langLabel(record.target_language)}
                  </p>
                  <CopyButton text={record.translated_text} />
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{record.translated_text}</p>
                </div>
              </div>

              {record.error_message && (
                <div className="rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-900/20 p-3">
                  <p className="text-xs text-red-600 dark:text-red-400">{record.error_message}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t">
              <DownloadPDFButton onDownload={() => downloadTranslationPDF(record)} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
