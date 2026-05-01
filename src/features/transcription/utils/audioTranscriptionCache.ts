import type { NormalizedTranscriptionPayload, TranscriptionWordTimestamp } from "../types/transcription.types";

const STORAGE_KEY = "hasab_audio_word_cache_v1";
const MAX_JSON_CHARS = 4_000_000;

type CacheEntry = {
  t: number;
  words: TranscriptionWordTimestamp[] | null;
  numSpeakers: number | null;
  transcriptionText: string | null;
  transcriptionLang: string | null;
};

let memoryMap: Record<string, CacheEntry> | null = null;

function loadMap(): Record<string, CacheEntry> {
  if (memoryMap) return memoryMap;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
    memoryMap = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    memoryMap = {};
  }
  return memoryMap;
}

function pruneMap(map: Record<string, CacheEntry>): Record<string, CacheEntry> {
  const keys = Object.keys(map);
  if (keys.length <= 12) return map;
  const keep = keys
    .map((k) => ({ k, t: map[k]?.t ?? 0 }))
    .sort((a, b) => b.t - a.t)
    .slice(0, 12)
    .map((x) => x.k);
  const next: Record<string, CacheEntry> = {};
  for (const k of keep) next[k] = map[k];
  return next;
}

function persistMap(map: Record<string, CacheEntry>) {
  try {
    let json = JSON.stringify(map);
    if (json.length > MAX_JSON_CHARS) {
      map = pruneMap(map);
      json = JSON.stringify(map);
    }
    localStorage.setItem(STORAGE_KEY, json);
    memoryMap = map;
  } catch {
    memoryMap = map;
  }
}

export function rememberFromNormalized(audioId: string | number | null, normalized: NormalizedTranscriptionPayload | null) {
  if (audioId == null || !normalized) return;
  const hasWords = Array.isArray(normalized.timestampPayload) && normalized.timestampPayload.length > 0;
  const hasNumSpeakers = Number.isFinite(normalized.numSpeakers) && (normalized.numSpeakers ?? 0) > 0;
  if (!hasWords && !hasNumSpeakers) return;

  const id = String(audioId);
  const map = { ...loadMap() };
  const previous = map[id];
  map[id] = {
    t: Date.now(),
    words: hasWords ? normalized.timestampPayload : previous?.words ?? null,
    numSpeakers: hasNumSpeakers ? normalized.numSpeakers : previous?.numSpeakers ?? null,
    transcriptionText: normalized.transcriptionText || previous?.transcriptionText || null,
    transcriptionLang: normalized.transcriptionLang ?? previous?.transcriptionLang ?? null,
  };
  persistMap(map);
}

export function mergeNormalizedWithCache(
  audioId: string | number | null,
  normalized: NormalizedTranscriptionPayload | null
): NormalizedTranscriptionPayload | null {
  if (!normalized || audioId == null) return normalized;
  const cached = loadMap()[String(audioId)];
  if (!cached) return normalized;

  const merged: NormalizedTranscriptionPayload = { ...normalized };
  const hasApiWords = Array.isArray(merged.timestampPayload) && merged.timestampPayload.length > 0;
  if (!hasApiWords && Array.isArray(cached.words) && cached.words.length > 0) {
    merged.timestampPayload = cached.words;
  }
  if ((!Number.isFinite(merged.numSpeakers) || (merged.numSpeakers ?? 0) < 1) && cached.numSpeakers != null) {
    merged.numSpeakers = cached.numSpeakers;
  }
  if ((!merged.transcriptionText || !merged.transcriptionText.trim()) && cached.transcriptionText) {
    merged.transcriptionText = cached.transcriptionText;
  }
  if (merged.transcriptionLang == null && cached.transcriptionLang) {
    merged.transcriptionLang = cached.transcriptionLang;
  }
  return merged;
}
