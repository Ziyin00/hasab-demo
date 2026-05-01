/**
 * Must match Laravel validation `Rule::in([...])` for `language` / `source_language`.
 * Omit these fields entirely when unspecified (avoid sending invalid `"auto"`).
 */
export const TRANSCRIPTION_API_LANGUAGE_CODES = ["english", "amh", "tig", "orm"] as const;

export type TranscriptionApiLanguageCode = (typeof TRANSCRIPTION_API_LANGUAGE_CODES)[number];

export const TRANSCRIPTION_SOURCE_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: TranscriptionApiLanguageCode;
  label: string;
}> = [
  { value: "english", label: "English" },
  { value: "amh", label: "አማርኛ (Amharic)" },
  { value: "tig", label: "Tigrigna" },
  { value: "orm", label: "Oromoo" },
];

const ALLOWED = new Set<string>(TRANSCRIPTION_API_LANGUAGE_CODES);

const ALIASES: Record<string, TranscriptionApiLanguageCode> = {
  en: "english",
  eng: "english",
  amharic: "amh",
  am: "amh",
  አማርኛ: "amh",
  tigrinya: "tig",
  tigrigna: "tig",
  oromo: "orm",
  oromifa: "orm",
  om: "orm",
};

/** Returns a code accepted by the API, or `null` to omit language fields (auto-detect). */
export function coerceApiLanguageCode(raw: string | undefined | null): TranscriptionApiLanguageCode | null {
  const key = String(raw ?? "").trim().toLowerCase();
  if (!key || key === "auto") return null;
  if (ALLOWED.has(key)) return key as TranscriptionApiLanguageCode;
  return ALIASES[key] ?? null;
}
