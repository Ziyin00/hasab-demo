"use client";

import { FileText, Languages, ScanText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  NormalizedTranscriptionPayload,
  TranscriptSpeakerBlock,
} from "../../types/transcription.types";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { parseSummaryIntoBlocks } from "../../utils/formatSummaryForDisplay";
import { TranscriptSpeakerSection } from "./TranscriptSpeakerSection";

function tabIcon(Icon: typeof FileText) {
  return <Icon className="size-3.5 opacity-70" aria-hidden />;
}

function SummaryPanel({
  body,
  emptyTitle,
  emptyHint,
}: {
  body: string;
  emptyTitle: string;
  emptyHint?: string;
}) {
  const has = body.trim().length > 0;
  if (!has) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-10 text-center sm:py-14">
        <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
        {emptyHint ? (
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">{emptyHint}</p>
        ) : null}
      </div>
    );
  }

  const blocks = parseSummaryIntoBlocks(body);

  return (
    <article className="rounded-xl border border-border/80 bg-linear-to-b from-muted/25 to-muted/10 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
      <h2 className="sr-only">Summary</h2>
      <div className="flex flex-col gap-5 sm:gap-6">
        {blocks.map((block, i) =>
          block.kind === "paragraph" ? (
            <p
              key={`p-${i}`}
              className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-foreground md:text-base md:leading-relaxed"
            >
              {block.text}
            </p>
          ) : (
            <ul
              key={`ul-${i}`}
              className="list-none space-y-3  py-1 pl-0 md:space-y-3.5 md:pl-1"
            >
              {block.items.map((item, j) => (
                <li
                  key={j}
                  className="relative ps-5 text-[0.9375rem] leading-relaxed text-foreground before:absolute before:top-[0.65em] before:left-0 before:size-1.5 before:rounded-full before:bg-primary/75 md:ps-6 md:text-base md:leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ul>
          ),
        )}
      </div>
    </article>
  );
}

function TextPanel({
  title,
  body,
  emptyTitle,
  emptyHint,
}: {
  title: string;
  body: string;
  emptyTitle: string;
  emptyHint?: string;
}) {
  const has = body.trim().length > 0;
  if (!has) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center sm:py-14">
        <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
        {emptyHint ? <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">{emptyHint}</p> : null}
      </div>
    );
  }
  return (
    <article className="rounded-lg border border-border bg-muted/20 px-3 py-3 sm:px-4 sm:py-4">
      <h2 className="sr-only">{title}</h2>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground sm:text-[0.9375rem]">{body}</p>
    </article>
  );
}

export function TranscriptionWorkspaceContentTabs({
  result,
  blocks,
  speakerOrder,
  showSpeakers,
  isEditing,
  activeRowId,
  currentTime,
  displayText,
  rowRefs,
  setEditedById,
  seekAndPlay,
}: {
  result: NormalizedTranscriptionPayload;
  blocks: TranscriptSpeakerBlock[];
  speakerOrder: Map<string, number>;
  showSpeakers: boolean;
  isEditing: boolean;
  activeRowId: string | null;
  currentTime: number;
  displayText: string;
  rowRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  setEditedById: Dispatch<SetStateAction<Record<string, string>>>;
  seekAndPlay: (time: number) => void;
}) {
  const translation =
    typeof result.translation === "string" && result.translation.trim().length > 0
      ? result.translation.trim()
      : "";
  const summary =
    typeof result.summary === "string" && result.summary.trim().length > 0 ? result.summary.trim() : "";

  return (
    <Tabs defaultValue="transcript" className="w-full gap-0">
      <div className="sticky top-0 z-10 -mx-1 mb-4 overflow-x-auto border-b border-border/60 bg-background/90 px-1 pb-0 backdrop-blur-md [scrollbar-width:none] [-ms-overflow-style:none] supports-backdrop-filter:bg-background/75 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <TabsList variant="line" className="h-auto min-w-full justify-start gap-0 rounded-none bg-transparent p-0">
          <TabsTrigger value="transcript" className="h-10 shrink-0 gap-1.5 rounded-none px-3 py-2.5 text-xs whitespace-nowrap sm:px-4 sm:text-sm">
            {tabIcon(FileText)}
            Transcript
          </TabsTrigger>
          <TabsTrigger value="translation" className="h-10 shrink-0 gap-1.5 rounded-none px-3 py-2.5 text-xs whitespace-nowrap sm:px-4 sm:text-sm">
            {tabIcon(Languages)}
            Translation
            {translation ? (
              <span className="ml-0.5 inline-flex size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="summary" className="h-10 shrink-0 gap-1.5 rounded-none px-3 py-2.5 text-xs whitespace-nowrap sm:px-4 sm:text-sm">
            {tabIcon(ScanText)}
            Summary
            {summary ? (
              <span className="ml-0.5 inline-flex size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            ) : null}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="transcript" className="mt-0 min-h-48 space-y-5 sm:space-y-6 focus-visible:ring-0">
        {blocks.length > 0 ? (
          blocks.map((block) => (
            <TranscriptSpeakerSection
              key={`${block.speakerKey}-${block.startSeconds}`}
              block={block}
              showSpeakers={showSpeakers}
              speakerOrder={speakerOrder}
              activeRowId={activeRowId}
              isEditing={isEditing}
              currentTime={currentTime}
              rowRefs={rowRefs}
              setEditedById={setEditedById}
              seekAndPlay={seekAndPlay}
            />
          ))
        ) : (
          <div className="rounded-md border border-border p-3 sm:p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap sm:text-base">
              {displayText || "No transcript text available."}
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="translation" className="mt-0 min-h-48 focus-visible:ring-0">
        <TextPanel
          title="Translation"
          body={translation}
          emptyTitle="No translation available"
          emptyHint="Enable Translate when uploading, or open this tab again after processing finishes if translation was requested."
        />
      </TabsContent>

      <TabsContent value="summary" className="mt-0 min-h-48 focus-visible:ring-0">
        <SummaryPanel
          body={summary}
          emptyTitle="No summary available"
          emptyHint="Enable Summarization when uploading, or check back after the job completes."
        />
      </TabsContent>
    </Tabs>
  );
}
