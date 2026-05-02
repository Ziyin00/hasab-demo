/**
 * Legacy playground persisted `axios res.data`: `{ data: { translation: { source_text, translated_text }}}`.
 */
export type TranslationApiStoredBody = Record<string, unknown>;

/** Read from localStorage: legacy body, or old dashboard `{ texts, raw }` (unwrap `raw`). */
export function coerceStoredTranslationPayload(parsed: unknown): TranslationApiStoredBody | null {
  if (parsed == null || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.raw != null && typeof o.raw === "object") {
    return o.raw as TranslationApiStoredBody;
  }
  return o as TranslationApiStoredBody;
}

export function getTranslationPairFromApiBody(payload: TranslationApiStoredBody | null): {
  sourceText: string;
  translatedText: string;
} {
  if (!payload) return { sourceText: "", translatedText: "" };
  const data = payload.data;
  if (data == null || typeof data !== "object") return { sourceText: "", translatedText: "" };
  const translation = (data as Record<string, unknown>).translation;
  if (translation == null || typeof translation !== "object") {
    return { sourceText: "", translatedText: "" };
  }
  const tr = translation as Record<string, unknown>;

  const pick = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return String(v);
  };

  return {
    sourceText: pick(tr.source_text),
    translatedText: pick(tr.translated_text),
  };
}

/** Same filtering as legacy `parseJson` for JSON viewer — strip `id` / `user_id` recursively */
export function sanitizeTranslationJsonForViewer(value: unknown): unknown {
  const strip = (obj: unknown): unknown => {
    if (Array.isArray(obj)) return obj.map(strip);
    if (obj !== null && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj as Record<string, unknown>)
          .filter(([key]) => key !== "id" && key !== "user_id")
          .map(([key, val]) => [key, strip(val)]),
      );
    }
    return obj;
  };
  return strip(value);
}
