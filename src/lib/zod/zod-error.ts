import { z } from "zod";

export const formatZodError = (error: z.ZodError) => {
  return error.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));
};
