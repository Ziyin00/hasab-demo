import { z } from "zod";

export const translationTextRequestSchema = z.object({
  text: z
    .string()
    .min(15, "Enter at least 15 characters.")
    .max(50_000, "Text is too long — try a shorter passage."),
  sourceLanguage: z.string(),
  targetLanguage: z.string().min(1, "Select a target language."),
});
