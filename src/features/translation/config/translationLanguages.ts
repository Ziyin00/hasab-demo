/**
 * Codes for POST `/translate` (matches legacy playground contract: `auto`, `eng`, etc.).
 */
export const TRANSLATION_SOURCE_LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "amh", label: "አማርኛ (Amharic)" },
  { value: "eng", label: "English" },
  { value: "tig", label: "ትግርኛ (Tigrigna)" },
  { value: "orm", label: "Afaan Oromoo" },
] as const;

export const TRANSLATION_TARGET_LANGUAGES = TRANSLATION_SOURCE_LANGUAGES.filter((l) => l.value !== "auto");
