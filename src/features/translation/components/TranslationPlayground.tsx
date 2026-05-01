"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslationPlaygroundStore } from "@/store/translation-playground.store";
import { translationTextRequestSchema } from "../schemas/translation-request.schema";
import type { TranslationTextFormValues } from "../types/translation.types";
import { useTranslateText } from "../hooks/useTranslation";
import { TRANSLATION_SOURCE_LANGUAGES, TRANSLATION_TARGET_LANGUAGES } from "../config/translationLanguages";
import { exportTranslationPdf, exportTranslationTxt } from "../utils/exportTranslation";
import {
  getTranslationPairFromApiBody,
  sanitizeTranslationJsonForViewer,
} from "../utils/translationResultPayload";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const LS_TEXT = "playground.translation.text";
const LS_SOURCE = "playground.translation.source";
const LS_TARGET = "playground.translation.target";

function languageLabel(code: string, list: readonly { value: string; label: string }[]) {
  return list.find((o) => o.value === code)?.label ?? code;
}

function useCopiedFeedback() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    if (!text?.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }, []);
  return { copied, copy };
}

export function TranslationPlayground() {
  const translationResult = useTranslationPlaygroundStore((s) => s.translationResult);
  const setTranslationResult = useTranslationPlaygroundStore((s) => s.setTranslationResult);
  const hydrateTranslationResultFromStorage = useTranslationPlaygroundStore((s) => s.hydrateTranslationResultFromStorage);
  const [tab, setTab] = useState<"pair" | "json">("pair");
  const originalCopy = useCopiedFeedback();
  const translatedCopy = useCopiedFeedback();

  const methods = useForm<TranslationTextFormValues>({
    resolver: zodResolver(translationTextRequestSchema),
    defaultValues: { text: "", sourceLanguage: "auto", targetLanguage: "" },
  });

  const { watch, setValue, formState, reset } = methods;
  const text = watch("text");
  const sourceLanguage = watch("sourceLanguage");
  const targetLanguage = watch("targetLanguage");

  useEffect(() => {
    document.title = "Playground · Translation";
  }, []);

  useEffect(() => {
    hydrateTranslationResultFromStorage();
  }, [hydrateTranslationResultFromStorage]);

  useEffect(() => {
    try {
      const st = sessionStorage.getItem(LS_TEXT);
      const ss = sessionStorage.getItem(LS_SOURCE);
      const tg = sessionStorage.getItem(LS_TARGET);
      if (st != null) setValue("text", st, { shouldDirty: false });
      if (ss != null) setValue("sourceLanguage", ss, { shouldDirty: false });
      if (tg != null) setValue("targetLanguage", tg ?? "", { shouldDirty: false });
    } catch {
      /* noop */
    }
  }, [setValue]);

  useEffect(() => {
    try {
      sessionStorage.setItem(LS_TEXT, text ?? "");
      sessionStorage.setItem(LS_SOURCE, sourceLanguage ?? "auto");
      sessionStorage.setItem(LS_TARGET, targetLanguage ?? "");
    } catch {
      /* noop */
    }
  }, [text, sourceLanguage, targetLanguage]);

  const mutation = useTranslateText({
    /** Legacy global: persist full `res.data` (`.data.translation.*`) under `translationResult` */
    onSuccess: (data) => setTranslationResult(data.raw),
  });

  const resultPair = useMemo(
    () => getTranslationPairFromApiBody(translationResult ?? null),
    [translationResult],
  );

  const onSubmit = methods.handleSubmit((data) => {
    setTab("pair");
    mutation.mutate(data);
  });

  const handleSwapLanguages = () => {
    if (sourceLanguage === "auto" || !targetLanguage) return;
    setValue("sourceLanguage", targetLanguage, { shouldDirty: true });
    setValue("targetLanguage", sourceLanguage, { shouldDirty: true });
  };

  const handleNewTranslation = () => {
    setTranslationResult(null);
    setTab("pair");
    reset({ text: "", sourceLanguage: "auto", targetLanguage: "" });
    mutation.reset();
    try {
      sessionStorage.removeItem(LS_TEXT);
      sessionStorage.removeItem(LS_SOURCE);
      sessionStorage.removeItem(LS_TARGET);
    } catch {
      /* noop */
    }
  };

  const jsonPretty = useMemo(() => {
    try {
      const sanitized = sanitizeTranslationJsonForViewer(translationResult ?? {});
      return JSON.stringify(sanitized, null, 2);
    } catch {
      return "{}";
    }
  }, [translationResult]);

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      <div className="w-full min-w-0 rounded-xl border border-border bg-card shadow-sm">
        {!translationResult ? (
          <>
          <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-3 sm:px-4 lg:flex-nowrap">
            <div className="grid min-w-0 w-full grid-cols-1 gap-3 sm:flex-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end sm:gap-2 md:gap-3">
              <div className="grid min-w-0 w-full gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Source language</Label>
                <Select
                  value={sourceLanguage}
                  onValueChange={(v) => setValue("sourceLanguage", v, { shouldDirty: true, shouldValidate: true })}
                >
                  <SelectTrigger className="h-11 w-full min-w-0 max-w-full cursor-pointer bg-background text-left text-sm md:h-10">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[min(320px,50dvh)] w-[calc(100vw-2rem)] max-w-none sm:max-w-[var(--radix-select-trigger-width)]">
                    {TRANSLATION_SOURCE_LANGUAGES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center sm:justify-center sm:self-end sm:pb-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 shrink-0 touch-manipulation sm:size-10"
                  disabled={sourceLanguage === "auto" || !targetLanguage}
                  onClick={handleSwapLanguages}
                  title="Swap languages"
                >
                  <ArrowLeftRight className="size-4" aria-hidden />
                </Button>
              </div>

              <div className="grid min-w-0 w-full gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Target language</Label>
                <Select
                  value={targetLanguage || ""}
                  onValueChange={(v) => setValue("targetLanguage", v, { shouldDirty: true, shouldValidate: true })}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(formState.errors.targetLanguage)}
                    className="h-11 w-full min-w-0 max-w-full cursor-pointer bg-background text-left text-sm md:h-10"
                  >
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[min(320px,50dvh)] w-[calc(100vw-2rem)] max-w-none sm:max-w-[var(--radix-select-trigger-width)]">
                    {TRANSLATION_TARGET_LANGUAGES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="button"
              className={cn(
                "h-11 w-full shrink-0 touch-manipulation sm:ml-auto sm:w-auto sm:min-w-[8.75rem] lg:shrink-0",
                "bg-linear-to-br from-[#7C20D0] to-[#D020C9] text-white shadow-md hover:opacity-92",
              )}
              disabled={mutation.isPending}
              onClick={onSubmit}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Translating…
                </>
              ) : (
                "Translate"
              )}
            </Button>
          </div>

        <div className="relative p-3 sm:p-4 md:p-5">
          {formState.errors.text?.message || formState.errors.targetLanguage?.message ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="size-4" />
              <AlertTitle className="text-sm font-medium">Unable to translate</AlertTitle>
              <AlertDescription className="text-sm">
                {formState.errors.text?.message ??
                  formState.errors.targetLanguage?.message ??
                  "Check the inputs and try again."}
              </AlertDescription>
            </Alert>
          ) : null}

              <Textarea
                value={text}
                onChange={(e) =>
                  setValue("text", e.target.value, { shouldDirty: true, shouldValidate: true })
                }
                placeholder="Type or paste the text you want to translate..."
                aria-invalid={Boolean(formState.errors.text)}
                disabled={mutation.isPending}
                className={cn(
                  "min-h-[min(280px,max(12rem,38dvh))] resize-y border-dashed bg-background px-3 py-3 text-base leading-relaxed sm:min-h-[min(360px,max(16rem,42dvh))] sm:px-4 md:min-h-[min(440px,calc(100dvh-22rem))]",
                  formState.errors.text?.message && "border-destructive/60",
                )}
              />
              <p className="mt-2 text-pretty text-xs text-muted-foreground sm:mt-3">
                Minimum 15 characters. Draft text is remembered for this browser session only.
              </p>

          {mutation.isPending && (
            <div className="absolute inset-3 z-10 flex flex-col items-center justify-center gap-3 rounded-lg border border-border/60 bg-background/80 backdrop-blur-sm sm:inset-4 md:inset-5">
              <Loader2 className="size-9 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Translating…</p>
            </div>
          )}
        </div>
          </>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "pair" | "json")} className="w-full min-w-0">
            <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-1 h-10 w-full justify-center touch-manipulation gap-2 sm:h-9 sm:w-fit sm:justify-start"
                onClick={handleNewTranslation}
              >
                <ArrowLeft className="size-4 shrink-0" />
                <span className="truncate">Translate new text</span>
              </Button>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <TabsList className="grid h-10 w-full shrink-0 grid-cols-2 rounded-lg bg-muted/80 p-0.5 sm:flex sm:h-9 sm:w-auto">
                  <TabsTrigger
                    value="pair"
                    className="rounded-md px-2 text-xs sm:px-3 sm:text-sm"
                  >
                    Result
                  </TabsTrigger>
                  <TabsTrigger value="json" className="rounded-md px-2 text-xs sm:px-3 sm:text-sm">
                    JSON
                  </TabsTrigger>
                </TabsList>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-full touch-manipulation gap-2 sm:h-9 sm:w-auto sm:min-w-[7.5rem]"
                    >
                      <Download className="size-4 shrink-0" />
                      Export
                      <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[10rem]" sideOffset={4}>
                    <DropdownMenuItem
                      onClick={() =>
                        exportTranslationTxt(resultPair.sourceText, resultPair.translatedText)
                      }
                    >
                      Download .txt
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        void exportTranslationPdf(resultPair.sourceText, resultPair.translatedText)
                      }
                    >
                      Download .pdf
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="relative p-3 sm:p-4 md:p-5">
              <TabsContent value="pair" className="mt-0 outline-none focus-visible:ring-0">
                <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                  <PanelBlock
                    label="Original Text"
                    sub={languageLabel(sourceLanguage, TRANSLATION_SOURCE_LANGUAGES)}
                    value={resultPair.sourceText}
                    copied={originalCopy.copied}
                    onCopy={() => originalCopy.copy(resultPair.sourceText)}
                  />
                  <PanelBlock
                    label="Translated Text"
                    sub={languageLabel(targetLanguage, TRANSLATION_TARGET_LANGUAGES)}
                    value={resultPair.translatedText}
                    copied={translatedCopy.copied}
                    onCopy={() => translatedCopy.copy(resultPair.translatedText)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="json" className="mt-0 outline-none focus-visible:ring-0">
                <div className="max-h-[min(55dvh,520px)] min-h-[12rem] overflow-x-auto overflow-y-auto overscroll-contain rounded-lg border bg-muted/20 sm:max-h-[min(50dvh,480px)]">
                  <pre className="break-words p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground sm:p-4 sm:text-xs">{jsonPretty}</pre>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function PanelBlock({
  label,
  sub,
  value,
  copied,
  onCopy,
}: {
  label: string;
  sub: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="max-w-[100%] text-right text-xs text-muted-foreground break-words sm:max-w-[55%]">
          {sub}
        </span>
      </div>
      <div className="relative min-w-0">
        <Textarea
          readOnly
          rows={10}
          value={value}
          className="min-h-[12rem] resize-none bg-muted/30 py-3 pr-12 text-base leading-relaxed sm:min-h-[14rem] sm:text-sm md:min-h-[16.25rem]"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 size-11 shrink-0 touch-manipulation sm:size-10"
          title="Copy"
          onClick={onCopy}
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
