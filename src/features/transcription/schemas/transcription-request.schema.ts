import { z } from "zod";

export const transcriptionRequestSchema = z
  .object({
    file: z.any().refine((file) => file instanceof File, "Must be a file"),
    language: z.string().optional(),
    style: z.string().optional(),
    burnIn: z.boolean().default(false),
    diarization: z.boolean().default(true),
    summarize: z.boolean().default(false),
    translate: z.boolean().default(false),
    targetLanguage: z.string().optional().default(""),
  })
  .refine((data) => !data.translate || String(data.targetLanguage ?? "").trim().length > 0, {
    message: "Select a target language for translation.",
    path: ["targetLanguage"],
  });
