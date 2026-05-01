import type { NormalizedTranscriptionPayload, TranscriptionWordTimestamp } from "../types/transcription.types";

export const audioResourceDetailParams = Object.freeze({
  timestamp: "true",
  diarize: "true",
});

export function unwrapAudioResource(body: unknown): Record<string, any> | null {
  if (body == null || typeof body !== "object") return null;
  const record = body as Record<string, any>;
  const inner = record.data;
  if (
    inner != null &&
    typeof inner === "object" &&
    !Array.isArray(inner) &&
    (inner.id != null ||
      inner.transcription != null ||
      inner.timestamp != null ||
      inner.audio_url != null)
  ) {
    return inner as Record<string, any>;
  }
  if (
    record.id != null ||
    record.transcription != null ||
    record.timestamp != null ||
    record.audio_url != null
  ) {
    return record;
  }
  return inner && typeof inner === "object" ? (inner as Record<string, any>) : null;
}

function asWordArray(val: unknown): TranscriptionWordTimestamp[] | null {
  if (val == null) return null;
  if (Array.isArray(val)) return val as TranscriptionWordTimestamp[];
  if (typeof val === "string") {
    const s = val.trim();
    if (!s || s === "null") return null;
    if (s.startsWith("[") || s.startsWith("{")) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? (parsed as TranscriptionWordTimestamp[]) : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function countDistinctSpeakers(words: TranscriptionWordTimestamp[] | null): number | null {
  if (!Array.isArray(words)) return null;
  const set = new Set<string>();
  for (const word of words) {
    if (word?.speaker != null && String(word.speaker).trim() !== "") {
      set.add(String(word.speaker));
    }
  }
  return set.size > 0 ? set.size : null;
}

function pickWordTimestampArray(data: Record<string, any>, rawTr: unknown): TranscriptionWordTimestamp[] | null {
  const tr = rawTr && typeof rawTr === "object" ? (rawTr as Record<string, any>) : null;
  const candidates: unknown[] = [
    tr?.timestamp,
    tr?.timestamps,
    tr?.words,
    tr?.word_timestamps,
    data.timestamp,
    data.timestamps,
    data.words,
    data.word_timestamps,
    data.segments,
    data.word_segments,
    data.transcription_segments,
    data.data?.timestamp,
    data.data?.timestamps,
    data.data?.words,
  ];

  for (const value of candidates) {
    const arr = asWordArray(value);
    if (Array.isArray(arr) && arr.length > 0) return arr;
  }
  for (const value of candidates) {
    const arr = asWordArray(value);
    if (Array.isArray(arr)) return arr;
  }
  return null;
}

function pickTextField(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : null;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["text", "content", "body", "value", "translation", "translated_text"]) {
      const inner = o[k];
      if (typeof inner === "string" && inner.trim()) return inner.trim();
    }
  }
  return null;
}

function pickSummaryOrTranslation(record: Record<string, any>, ...keys: string[]): string | null {
  for (const k of keys) {
    const t = pickTextField(record[k]);
    if (t) return t;
  }
  return null;
}

export function normalizeTranscriptionPayload(data: unknown): NormalizedTranscriptionPayload | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, any>;

  let rawTr: unknown = record.transcription;
  if (typeof rawTr === "string" && rawTr.trim().startsWith("{")) {
    try {
      rawTr = JSON.parse(rawTr);
    } catch {
      // keep original string
    }
  }

  const timestampPayload = pickWordTimestampArray(record, rawTr);

  let transcriptionText = "";
  let transcriptionLang: string | null = null;
  if (typeof rawTr === "string") {
    transcriptionText = rawTr;
  } else if (rawTr && typeof rawTr === "object") {
    const tr = rawTr as Record<string, any>;
    transcriptionText = tr.text != null ? String(tr.text) : "";
    transcriptionLang = tr.lang != null ? String(tr.lang) : null;
  }

  if (!transcriptionText && typeof record.text === "string") {
    transcriptionText = record.text;
  }

  let numSpeakers: number | null = null;
  if (rawTr && typeof rawTr === "object" && (rawTr as Record<string, any>).num_speakers != null) {
    numSpeakers = Number((rawTr as Record<string, any>).num_speakers);
  }
  if ((!Number.isFinite(numSpeakers) || (numSpeakers ?? 0) < 1) && record.num_speakers != null) {
    numSpeakers = Number(record.num_speakers);
  }
  if ((!Number.isFinite(numSpeakers) || (numSpeakers ?? 0) < 1) && Array.isArray(timestampPayload)) {
    const inferred = countDistinctSpeakers(timestampPayload);
    if (inferred != null) numSpeakers = inferred;
  }

  const audioId =
    record.id ??
    record.audio_id ??
    record.audioId ??
    record.audio?.id ??
    record.audio?.audio_id ??
    null;

  const trRecord = rawTr && typeof rawTr === "object" ? (rawTr as Record<string, any>) : null;
  const transcriptionResultBag =
    record.transcriptionResult && typeof record.transcriptionResult === "object"
      ? (record.transcriptionResult as Record<string, any>)
      : record.transcription_result && typeof record.transcription_result === "object"
        ? (record.transcription_result as Record<string, any>)
        : null;

  const translation =
    pickSummaryOrTranslation(record, "translation", "translated_text", "translation_text", "translated_transcript") ??
    pickTextField(record.data?.translation) ??
    pickTextField(record.data?.translated_text) ??
    (transcriptionResultBag
      ? pickSummaryOrTranslation(
          transcriptionResultBag,
          "translation",
          "translated_text",
          "text",
          "body",
        )
      : null) ??
    (trRecord
      ? pickSummaryOrTranslation(
          trRecord,
          "translation",
          "translated_text",
          "translation_text",
          "translated_transcript",
          "translated_content",
          "target_text",
          "locale_text",
        )
      : null);

  const summary =
    pickSummaryOrTranslation(record, "summary", "summarization", "summarized_text") ??
    pickTextField(record.data?.summary) ??
    pickTextField(record.data?.summarization) ??
    (trRecord
      ? pickSummaryOrTranslation(trRecord, "summary", "summarization", "summarized_text", "summary_text")
      : null);

  return {
    transcriptionText,
    timestampPayload,
    numSpeakers: Number.isFinite(numSpeakers) ? numSpeakers : null,
    transcriptionLang,
    translation,
    summary,
    audioUrl: record.audio_url ?? record.url ?? null,
    audioId,
    originalFilename: record.original_filename ?? record.filename ?? null,
    fileSize: record.file_size ?? null,
  };
}
