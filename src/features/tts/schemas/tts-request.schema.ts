import { z } from "zod/v3";

export const ttsRequestSchema = z.object({
  text: z.string().min(1, "Text is required").max(5000),
  voice: z.string().min(1, "Voice selection is required"),
  speed: z.number().min(0.5).max(2.0).default(1.0),
});
