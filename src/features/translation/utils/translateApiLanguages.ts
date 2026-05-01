/**
 * POST `/translate` expects **short** codes (`eng`, `amh`, `tig`, `orm`) — see successful
 * `translation.source_language` / `target_language` in API responses — **not** `english`
 * used by transcription upload.
 */

const TRANSLATE_IN = new Set(["eng", "amh", "tig", "orm"]);

/** UI / shorthand → canonical translate API code */
const TO_TRANSLATE_API: Record<string, string> = {
  eng: "eng",
  english: "eng",
  en: "eng",
  amh: "amh",
  amharic: "amh",
  am: "amh",
  tig: "tig",
  tigrinya: "tig",
  tigrigna: "tig",
  orm: "orm",
  oromo: "orm",
  oromifa: "orm",
};

/**
 * Returns a code accepted by `POST /translate`, or `null` to omit `source_language`
 * (auto-detect — **do not** send literal `"auto"` if backend rejects it).
 */
export function translateLanguageForApi(raw: string | undefined | null): string | null {
  const k = String(raw ?? "").trim().toLowerCase();
  if (!k || k === "auto") return null;
  if (TRANSLATE_IN.has(k)) return k;
  const mapped = TO_TRANSLATE_API[k];
  return mapped && TRANSLATE_IN.has(mapped) ? mapped : null;
}
