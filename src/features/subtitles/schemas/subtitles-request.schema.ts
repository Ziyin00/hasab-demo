import { z } from "zod";

export const subtitlesRequestSchema = z.object({
  file: z.any().refine((file) => file instanceof File, "Must be a file"),
  style: z.string().optional(),
  burnIn: z.boolean().default(false),
});
