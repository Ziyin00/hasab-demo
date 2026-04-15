import { z } from "zod";

export const translationRequestSchema = z.object({
  file: z.any().optional(),
  text: z.string().optional(),
  sourceLanguage: z.string().optional(),
  targetLanguage: z.string().min(1, "Target language is required"),
}).refine(data => data.file || data.text, {
  message: "Either file or text must be provided",
  path: ["text"],
});
