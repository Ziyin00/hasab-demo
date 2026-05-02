import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { postTextTranslation } from "../api/translation.api";
import type { TranslationTextFormValues } from "../types/translation.types";
import type { TranslationApiStoredBody } from "../utils/translationResultPayload";

/** Laravel often sets `message` to this while real detail lives in `errors`. */
const LARAVEL_GENERIC_INVALID = /^The given data was invalid\.?$/i;

/** Laravel `{ errors: { field: ["msg"] } }` → dedupe, readable for toasts */
function formatBackendValidationMessages(error: unknown): string | null {
  const e = error as { response?: { data?: { errors?: Record<string, unknown> } } };
  const errors = e?.response?.data?.errors;
  if (!errors || typeof errors !== "object") return null;
  const parts = new Set<string>();
  for (const raw of Object.values(errors)) {
    if (Array.isArray(raw)) {
      raw.forEach((m) => {
        if (typeof m === "string" && m.trim()) parts.add(m.trim());
      });
    } else if (typeof raw === "string" && raw.trim()) {
      parts.add(raw.trim());
    }
  }
  return parts.size ? [...parts].join(" ") : null;
}

function apiErrorMessage(error: unknown): string {
  const err = error as {
    message?: string;
    response?: {
      status?: number;
      data?: { message?: string; error?: string };
    };
  };
  const status = err.response?.status;

  if (status === 402) {
    return "Insufficient Balance: Your account balance is too low to process this request. Please top up your account to continue.";
  }

  const payload = err.response?.data;
  let apiMessage = "";
  if (payload && typeof payload === "object") {
    const p = payload as { message?: string; error?: string };
    apiMessage =
      typeof p.message === "string" && p.message.trim()
        ? p.message.trim()
        : typeof p.error === "string" && p.error.trim()
          ? p.error.trim()
          : "";
  }

  const validation = formatBackendValidationMessages(error);
  if (validation && (!apiMessage || LARAVEL_GENERIC_INVALID.test(apiMessage))) {
    return validation;
  }
  if (apiMessage) return apiMessage;
  if (validation) return validation;
  if (err.message === "EMPTY_TRANSLATION_RESPONSE") {
    return "The server returned an empty translation — try again or contact support.";
  }
  if (err.message === "MISSING_TARGET_LANGUAGE") {
    return "Select a target language.";
  }
  return err.message || "Translation failed.";
}

export function useTranslateText(options?: {
  onSuccess?: (data: {
    texts: { sourceText: string; translatedText: string };
    raw: TranslationApiStoredBody;
  }) => void;
}) {
  return useMutation({
    mutationFn: async (input: TranslationTextFormValues) =>
      postTextTranslation({
        text: input.text.trim(),
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
      }),
    onSuccess: (data) => {
      toast.success("Translation ready");
      options?.onSuccess?.(data);
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error));
    },
  });
}
