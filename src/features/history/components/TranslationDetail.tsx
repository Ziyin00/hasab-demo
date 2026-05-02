"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { historyApi } from "../api/history.api";

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

export function TranslationDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["history", "translation", "detail", id],
    queryFn: () => historyApi.getTranslation(id),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <p className="text-muted-foreground text-sm">Failed to load translation.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {langLabel(data.source_language)} → {langLabel(data.target_language)}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(data.created_at)}</p>
        </div>
        <span className="text-xs text-muted-foreground">{data.character_count.toLocaleString()} chars</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {langLabel(data.source_language)}
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.source_text}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {langLabel(data.target_language)}
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.translated_text}</p>
        </div>
      </div>

      {!data.success && data.error_message && (
        <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{data.error_message}</p>
        </div>
      )}
    </div>
  );
}
