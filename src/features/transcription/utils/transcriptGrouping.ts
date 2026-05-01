import type { Dispatch, SetStateAction } from "react";
import type { TranscriptGroupMode, TranscriptSpeakerBlock, TranscriptWorkspaceRow } from "../types/transcription.types";

export const TRANSCRIPT_SPEAKER_COLOR_CLASSES = [
  "text-emerald-700 dark:text-emerald-400",
  "text-indigo-700 dark:text-indigo-400",
  "text-violet-700 dark:text-violet-400",
  "text-amber-700 dark:text-amber-400",
  "text-rose-700 dark:text-rose-400",
] as const;

const segmentBody = (seg: { text?: string; content?: string }) =>
  (seg?.text ?? seg?.content ?? "").toString().trim();

export function parseEmbeddedSpeakerPrefix(text: string) {
  const raw = String(text ?? "");
  const firstBreak = raw.search(/\r?\n/);
  const firstLine = firstBreak === -1 ? raw : raw.slice(0, firstBreak);
  const afterFirst = firstBreak === -1 ? "" : raw.slice(firstBreak);
  const re = /^(\s*)(speaker\s*[_]?\d+|speaker\s+\d+|spk\s*[_]?\d+)\s*:\s*/i;
  const match = firstLine.match(re);
  if (!match) return { speakerKey: null as string | null, cleanText: raw.trim() };
  const numMatch = match[2].match(/(\d+)/);
  const speakerKey = numMatch ? `speaker_${numMatch[1]}` : "speaker_0";
  const restOfFirst = firstLine.slice(match[0].length);
  return { speakerKey, cleanText: (restOfFirst + afterFirst).trim() };
}

export function normalizeSegmentsForDiarization(segments: Array<Record<string, unknown>>) {
  return segments.map((seg) => {
    const raw = String(seg.text ?? seg.content ?? "");
    const fromField =
      seg.speaker != null && String(seg.speaker).trim() !== "" ? String(seg.speaker).trim() : null;
    const { speakerKey, cleanText } = parseEmbeddedSpeakerPrefix(raw);
    const speaker = fromField ?? (speakerKey || undefined);
    return {
      ...seg,
      text: cleanText.trim(),
      content: cleanText.trim(),
      speaker,
    };
  });
}

export function getSegmentStartEnd(seg: Record<string, unknown>) {
  const start = Number(seg.start ?? seg.start_time ?? seg.startSeconds ?? 0);
  let end = Number(seg.end ?? seg.end_time ?? seg.endSeconds ?? start);
  if (end < start) end = start;
  return { start, end };
}

export function mergeConsecutiveSpeakerRun(
  buffer: Array<{ start: number; end: number; text: string; speakerKey: string; id?: string }>
) {
  if (!buffer.length) return null;
  const first = buffer[0];
  const last = buffer[buffer.length - 1];
  const text = buffer.map((b) => b.text).join(" ");
  const segmentIds = buffer.map((b) => b.id).filter(Boolean) as string[];
  const words = buffer.map((b) => ({
    text: b.text,
    start: b.start,
    end: b.end,
  }));
  return {
    start: first.start,
    end: last.end,
    text,
    speaker: first.speakerKey === "__none__" ? undefined : first.speakerKey,
    segmentIds,
    words,
  };
}

export function groupSegmentsWithinSpeakerTurns(
  segments: Array<Record<string, unknown>>,
  mode: TranscriptGroupMode,
  characterLimit: number,
  timeLimit: number
) {
  const rows = segments
    .map((seg) => {
      const { start, end } = getSegmentStartEnd(seg);
      const text = segmentBody(seg as { text?: string; content?: string });
      const speakerKey =
        seg.speaker != null && String(seg.speaker).trim() !== "" ? String(seg.speaker).trim() : "__none__";
      return { start, end, text, speakerKey, id: seg.id ? String(seg.id) : undefined };
    })
    .filter((r) => r.text);

  if (rows.length === 0) return [] as Array<ReturnType<typeof mergeConsecutiveSpeakerRun>>;
  if (mode === "paragraph") return rows.map((r) => mergeConsecutiveSpeakerRun([r]));

  const out: Array<ReturnType<typeof mergeConsecutiveSpeakerRun>> = [];
  let buffer: typeof rows = [];
  let charCount = 0;
  let blockStart = 0;

  for (const seg of rows) {
    if (buffer.length === 0) {
      buffer.push(seg);
      charCount = seg.text.length;
      blockStart = seg.start;
      continue;
    }
    const prev = buffer[buffer.length - 1];
    if (prev.speakerKey !== seg.speakerKey) {
      out.push(mergeConsecutiveSpeakerRun(buffer));
      buffer = [seg];
      charCount = seg.text.length;
      blockStart = seg.start;
      continue;
    }
    if (mode === "character") {
      const nextCount = charCount + 1 + seg.text.length;
      if (nextCount > characterLimit) {
        out.push(mergeConsecutiveSpeakerRun(buffer));
        buffer = [seg];
        charCount = seg.text.length;
      } else {
        buffer.push(seg);
        charCount = nextCount;
      }
      continue;
    }
    const duration = seg.end - blockStart;
    if (duration > timeLimit) {
      out.push(mergeConsecutiveSpeakerRun(buffer));
      buffer = [seg];
      blockStart = seg.start;
    } else {
      buffer.push(seg);
    }
  }
  if (buffer.length) out.push(mergeConsecutiveSpeakerRun(buffer));
  return out;
}

export function groupSegmentsIntoSpeakerBlocks(
  segments: Array<ReturnType<typeof mergeConsecutiveSpeakerRun>>
): TranscriptSpeakerBlock[] {
  const blocks: TranscriptSpeakerBlock[] = [];
  let current: TranscriptSpeakerBlock | null = null;
  for (const seg of segments) {
    if (!seg) continue;
    const speakerKey = seg.speaker && String(seg.speaker).trim() ? String(seg.speaker).trim() : "__none__";
    const row: TranscriptWorkspaceRow = {
      id: `${speakerKey}-${seg.start}-${seg.end}`,
      startSeconds: seg.start,
      endSeconds: seg.end,
      speaker: seg.speaker,
      text: seg.text,
      segmentIds: seg.segmentIds,
      words: seg.words ?? [],
    };
    if (!current || current.speakerKey !== speakerKey) {
      if (current) blocks.push(current);
      current = {
        speakerKey,
        startSeconds: seg.start,
        endSeconds: seg.end,
        rows: [row],
      };
    } else {
      current.rows.push(row);
      current.endSeconds = seg.end;
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

export function buildSpeakerOrderMap(blocks: TranscriptSpeakerBlock[]) {
  const map = new Map<string, number>();
  let index = 0;
  for (const block of blocks) {
    const key = block.speakerKey;
    if (key === "__none__") continue;
    if (!map.has(key)) map.set(key, index++);
  }
  return map;
}

export function speakerBlockTitle(speakerKey: string, orderMap: Map<string, number>) {
  if (!speakerKey || speakerKey === "__none__") return null;
  const ord = orderMap.get(speakerKey);
  if (ord != null) return `Speaker ${String.fromCharCode(65 + ord)}`;
  return `Speaker ${speakerKey}`;
}

export function speakerColorClass(speakerKey: string, orderMap: Map<string, number>) {
  if (!speakerKey || speakerKey === "__none__") return "text-primary";
  const ord = orderMap.get(speakerKey) ?? 0;
  return TRANSCRIPT_SPEAKER_COLOR_CLASSES[ord % TRANSCRIPT_SPEAKER_COLOR_CLASSES.length];
}

export function applyRowTextToSegments(
  segmentIds: string[],
  newText: string,
  setEditedById: Dispatch<SetStateAction<Record<string, string>>>,
  rowId: string
) {
  setEditedById((prev) => ({ ...prev, [rowId]: newText }));
  if (!segmentIds?.length) return;
}

export function wordIsActive(currentTime: number, start: number, end: number) {
  const safeEnd = Number.isFinite(end) ? end : start + 0.12;
  return currentTime >= start && currentTime < safeEnd;
}
