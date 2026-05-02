"use client";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import type { TranscriptSpeakerBlock } from "../../types/transcription.types";
import { speakerBlockTitle, speakerColorClass } from "../../utils/transcriptGrouping";
import { TranscriptLineRow } from "./TranscriptLineRow";

export function TranscriptSpeakerSection({
  block,
  showSpeakers,
  speakerOrder,
  activeRowId,
  isEditing,
  currentTime,
  rowRefs,
  setEditedById,
  seekAndPlay,
}: {
  block: TranscriptSpeakerBlock;
  showSpeakers: boolean;
  speakerOrder: Map<string, number>;
  activeRowId: string | null;
  isEditing: boolean;
  currentTime: number;
  rowRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  setEditedById: Dispatch<SetStateAction<Record<string, string>>>;
  seekAndPlay: (time: number) => void;
}) {
  const sectionTitle = speakerBlockTitle(block.speakerKey, speakerOrder);

  return (
    <section>
      {showSpeakers && sectionTitle ? (
        <h3
          className={cn(
            "mb-1.5 text-xs font-semibold sm:mb-2 sm:text-sm",
            speakerColorClass(block.speakerKey, speakerOrder)
          )}
        >
          {sectionTitle}
        </h3>
      ) : null}
      <div className="space-y-3 sm:space-y-4">
        {block.rows.map((row) => (
          <TranscriptLineRow
            key={row.id}
            row={row}
            activeRowId={activeRowId}
            isEditing={isEditing}
            currentTime={currentTime}
            onSeekAndPlay={seekAndPlay}
            setEditedById={setEditedById}
            assignRowEl={(id, el) => {
              rowRefs.current[id] = el;
            }}
          />
        ))}
      </div>
    </section>
  );
}
