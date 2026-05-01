import { transcriptionConfig } from "../config/transcription.config";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transcriptionApi } from "../api/transcription.api";
import { mergeNormalizedWithCache, rememberFromNormalized } from "../utils/audioTranscriptionCache";
import type { TranscriptionRequest } from "../types/transcription.types";
import { useTranscriptionStore } from "@/store/transcription.store";
import { queryKeys } from "@/lib/react-query/queryKeys";

function formatBackendValidationMessages(error: unknown): string | null {
  const e = error as { response?: { data?: { errors?: Record<string, unknown> } } };
  const errors = e?.response?.data?.errors;
  if (!errors || typeof errors !== "object") return null;
  const segments: string[] = [];
  for (const [key, raw] of Object.entries(errors)) {
    if (Array.isArray(raw)) {
      raw.forEach((m) => {
        if (typeof m === "string" && m.trim()) segments.push(`${key}: ${m.trim()}`);
      });
    } else if (typeof raw === "string" && raw.trim()) {
      segments.push(`${key}: ${raw.trim()}`);
    }
  }
  return segments.length ? segments.join(" ") : null;
}

const srtToText = (srt: string) =>
  srt
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^\d+$/.test(line) && !line.includes("-->"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

export const useTranscription = () => {
  const queryClient = useQueryClient();
  const {
    setLastRequest,
    setLastResult,
    setLastSrt,
    setAudioMeta,
    setIsProcessing,
    setError,
  } = useTranscriptionStore();

  const mutation = useMutation({
    mutationFn: async (request: TranscriptionRequest) => {
      const { file, language, style, burnIn, diarization, summarize, translate, targetLanguage } = request;
      try {
        const { normalized, audioId } = await transcriptionApi.submitUploadThenPoll({
          file,
          language,
          style,
          burnIn,
          diarization,
          summarize,
          translate,
          targetLanguage,
        });
        const merged = mergeNormalizedWithCache(audioId, normalized);
        rememberFromNormalized(audioId, merged);
        return { mode: "primary" as const, audioId, normalized: merged };
      } catch (primaryError: any) {
        if (primaryError?.message === "POLL_TIMEOUT") {
          throw primaryError;
        }
      }

      const fallback = await transcriptionApi.subtitleFallback(request);
      const payload = fallback.data;
      const srt =
        payload?.data?.srt_content ||
        payload?.data?.srt ||
        payload?.srt_content ||
        payload?.srt ||
        payload?.subtitle ||
        payload?.content ||
        (typeof payload === "string" ? payload : "");

      if (!srt || typeof srt !== "string") {
        throw new Error("EMPTY_TRANSCRIPT");
      }

      return {
        mode: "fallback" as const,
        srt,
        normalized: {
          transcriptionText: srtToText(srt),
          timestampPayload: null,
          numSpeakers: null,
          transcriptionLang: request.language ?? null,
          translation: null,
          summary: null,
          audioUrl: null,
          audioId: null,
          originalFilename: request.file.name,
          fileSize: request.file.size,
        },
      };
    },
    onMutate: (request) => {
      setLastRequest(request);
      setError(null);
      setIsProcessing(true);
    },
    onSuccess: (result) => {
      setLastResult(result.normalized);
      if (result.mode === "primary") {
        setAudioMeta(result.audioId, result.normalized?.audioUrl ?? null);
        setLastSrt("");
        if (result.audioId) {
          queryClient.setQueryData(queryKeys.transcription.detail(result.audioId), result.normalized);
        }
      } else {
        setLastSrt(result.srt);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.transcription.list });
      toast.success("Transcription generated successfully");
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const validation = formatBackendValidationMessages(error);
      const message =
        validation ??
        (error?.message === "POLL_TIMEOUT"
          ? "Transcription is taking longer than expected."
          : status === 413
            ? "File is too large for direct processing. Please retry; large-file upload pipeline is being used."
            : (typeof error?.response?.data?.error === "string" && error.response.data.error.trim()
                ? error.response.data.error.trim()
                : undefined) ??
              error?.response?.data?.message ??
              error?.message ??
              "Failed to process transcription");
      setError(message);
      toast.error(message);
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const generateTranscription = async (request: TranscriptionRequest) => {
    if (!request.file) {
      toast.error("Please upload an audio or video file");
      return null;
    }
    return mutation.mutateAsync(request);
  };

  return {
    generateTranscription,
    config: transcriptionConfig,
    isProcessing: mutation.isPending,
  };
};
