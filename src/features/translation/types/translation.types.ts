/** Raw API response (varies by version). */
export type TranslationApiResponse = Record<string, unknown> & {
  data?: {
    translation?: {
      source_text?: string;
      translated_text?: string;
    };
    [key: string]: unknown;
  };
};

export type TranslationTexts = {
  sourceText: string;
  translatedText: string;
};

export interface TranslationTextFormValues {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}
