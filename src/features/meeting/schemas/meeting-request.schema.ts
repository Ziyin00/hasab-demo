import { z } from "zod";

export const meetingRequestSchema = z.object({
  file: z.any().refine((file) => file instanceof File, "Must be a file"),
  template: z.string().optional(),
  includeActionItems: z.boolean().default(true),
});
