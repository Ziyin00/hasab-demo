import { z } from "zod";

export function createTranslationTextRequestSchema(maxChars: number) {
  return z.object({
    text: z
      .string()
      .min(15, "Enter at least 15 characters.")
      .max(maxChars, `Text is too long — please limit to ${maxChars.toLocaleString()} characters.`),
    sourceLanguage: z.string(),
    targetLanguage: z.string().min(1, "Select a target language."),
  });
}

/** @deprecated – use createTranslationTextRequestSchema(maxChars) instead */
export const translationTextRequestSchema = createTranslationTextRequestSchema(5000);
