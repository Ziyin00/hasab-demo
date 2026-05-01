"use client";

import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import type { TranscriptWorkspaceRow } from "../../types/transcription.types";
import { applyRowTextToSegments, wordIsActive } from "../../utils/transcriptGrouping";
import { formatSeconds } from "../../utils/transcriptTimeFormat";

/** One highlight for the whole row (timestamp cell + full text) while this row owns playback time. */
const rowPlaybackAccentTimestamp = cn("rounded-md font-semibold text-primary sm:font-medium");
const rowPlaybackAccentText = cn(
  "rounded-md border border-primary font-medium  sm:font-medium",
);

/** Current word during playback — must win over row `text-primary` from parent. */
const activeWordClasses = "font-bold text-primary/80 dark:text-primary/80";
export function TranscriptLineRow({
  row,
  activeRowId,
  isEditing,
  currentTime,
  onSeekAndPlay,
  setEditedById,
  assignRowEl,
}: {
  row: TranscriptWorkspaceRow;
  activeRowId: string | null;
  isEditing: boolean;
  currentTime: number;
  onSeekAndPlay: (time: number) => void;
  setEditedById: Dispatch<SetStateAction<Record<string, string>>>;
  assignRowEl: (id: string, el: HTMLDivElement | null) => void;
}) {
  const isActive = activeRowId === row.id;

  const wordBtn =
    "touch-manipulation rounded px-0.5 py-0.25 text-inherit transition-colors hover:bg-muted/50 sm:py-px";

  return (
    <div
      ref={(el) => assignRowEl(row.id, el)}
      className="grid grid-cols-1 gap-y-2 sm:grid-cols-[minmax(3.25rem,auto)_minmax(0,1fr)] sm:gap-x-3 md:gap-x-4 md:grid-cols-[minmax(3.5rem,auto)_minmax(0,1fr)] lg:grid-cols-[4rem_minmax(0,1fr)]"
    >
      <button
        type="button"
        onClick={() => onSeekAndPlay(row.startSeconds)}
        aria-current={isActive ? "true" : undefined}
        title="Seek and play"
        className={cn(
          "w-fit touch-manipulation  px-1.5 py-0.5 text-left text-[11px] tabular-nums  sm:pt-0.5 sm:text-xs",
          isActive ? rowPlaybackAccentTimestamp : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
        )}
      >
        {formatSeconds(row.startSeconds)}
      </button>
      <div className="min-w-0">
        {isEditing ? (
          <p
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              applyRowTextToSegments(row.segmentIds, e.currentTarget.innerText, setEditedById, row.id);
            }}
            className={cn(
              "cursor-text -mx-1 rounded px-1 text-sm leading-relaxed outline-none transition-[color,border-color] hover:bg-muted/50 focus:bg-muted/40 sm:text-base",
              isActive && rowPlaybackAccentText,
            )}
          >
            {row.text}
          </p>
        ) : (
          <p
            className={cn(
              "-mx-1 text-sm leading-relaxed transition-[color,border-color] sm:text-base",
              row.words.length > 0 &&
                cn(
                  "rounded-md border px-2 py-1 hover:bg-muted/50",
                  isActive ? rowPlaybackAccentText : "border-transparent",
                ),
              row.words.length === 0 && "rounded px-1 hover:bg-muted/50",
            )}
          >
            {row.words.length > 0
              ? row.words.map((w, idx) => {
                  const wordActive = wordIsActive(currentTime, w.start, w.end);
                  return (
                    <span key={`${row.id}-w-${idx}`}>
                      {idx > 0 ? " " : null}
                      <button
                        type="button"
                        aria-current={wordActive ? "true" : undefined}
                        onClick={() => onSeekAndPlay(w.start)}
                        className={cn(wordBtn, wordActive && activeWordClasses)}
                      >
                        {w.text}
                      </button>
                    </span>
                  );
                })
              : (
                <button
                  type="button"
                  onClick={() => onSeekAndPlay(row.startSeconds)}
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-left transition-[color,border-color] sm:py-px",
                    isActive ? rowPlaybackAccentText : "border-transparent hover:bg-muted/60",
                  )}
                >
                  {row.text}
                </button>
                )}
          </p>
        )}
      </div>
    </div>
  );
}
