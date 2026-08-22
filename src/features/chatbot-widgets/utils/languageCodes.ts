/** UI language codes used in POST /chat `language` (not STT ISO 639-3). */
export type UiLanguageCode = "en" | "am" | "om";

const UI_ALIASES: Record<string, UiLanguageCode> = {
  en: "en",
  eng: "en",
  am: "am",
  amh: "am",
  om: "om",
  orm: "om",
};

const STT_BY_UI: Record<UiLanguageCode, string> = {
  en: "eng",
  am: "amh",
  om: "orm",
};

const INSTRUCTIONS: Record<UiLanguageCode, string> = {
  en: "CRITICAL: You MUST respond ONLY in English. Do not use any other language.",
  am: "CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). Do not use English or any other language.",
  om: "CRITICAL: You MUST respond ONLY in Afaan Oromoo. Do not use English, Amharic, or any other language.",
};

/** Map widget / visitor codes (incl. STT aliases) to chat UI codes. */
export function normalizeUiLanguageCode(code: string | undefined | null): UiLanguageCode {
  const key = String(code ?? "en").trim().toLowerCase();
  return UI_ALIASES[key] ?? "en";
}

/** STT upload language for a widget / visitor code. */
export function toSttLanguageCode(code: string | undefined | null): string {
  return STT_BY_UI[normalizeUiLanguageCode(code)];
}

/** Whether assistant TTS (Tigist) should be requested for this language. */
export function isTtsLanguage(code: string | undefined | null): boolean {
  return normalizeUiLanguageCode(code) === "am";
}

/** Widget-level TTS enabled and visitor language supports synthesis. */
export function shouldRequestTts(
  featuresTts: boolean | undefined,
  languageCode: string | undefined | null
): boolean {
  return featuresTts === true && isTtsLanguage(languageCode);
}

/** System instruction for the selected language (optional label for unknown codes). */
export function resolveLanguageInstruction(
  code: string | undefined | null,
  label?: string
): string {
  const ui = normalizeUiLanguageCode(code);
  if (INSTRUCTIONS[ui]) return INSTRUCTIONS[ui];
  const name = label?.trim() || code || "the selected language";
  return `CRITICAL: You MUST respond ONLY in ${name}. Do not use any other language.`;
}
