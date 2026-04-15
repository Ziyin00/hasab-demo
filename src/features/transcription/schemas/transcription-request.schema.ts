import { z } from "zod";

export const transcriptionRequestSchema = z.object({
  file: z.any().refine((file) => file instanceof File, "Must be a file"),
  language: z.string().optional(),
  diarization: z.boolean().default(false),
});

export type TranscriptionRequestInput = z.infer<typeof transcriptionRequestSchema>;
