import { apiClient } from "@/lib/api-client";
import { audioResourceDetailParams, normalizeTranscriptionPayload, unwrapAudioResource } from "../utils/normalizeTranscriptionPayload";
import type { NormalizedTranscriptionPayload, TranscriptionRequest } from "../types/transcription.types";
import { coerceApiLanguageCode } from "../config/transcriptionApiLanguages";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const flagTruthy = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1";

function pickAudioId(payload: any): string | null {
  const raw =
    payload?.audio?.id ||
    payload?.audio?.audio_id ||
    payload?.id ||
    payload?.audio_id ||
    payload?.data?.id ||
    payload?.data?.audio_id ||
    payload?.data?.audio?.id ||
    null;
  return raw != null ? String(raw) : null;
}

function getApiBaseUrl(): string {
  const fromClient = apiClient.defaults.baseURL;
  if (typeof fromClient === "string" && fromClient.trim()) {
    return fromClient.endsWith("/") ? fromClient : `${fromClient}/`;
  }
  const fromEnv = process.env.NEXT_PUBLIC_API_URL || "https://api.hasab.ai/api/v1";
  return fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
}

async function uploadToStorage(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ url: string; key: string; uuid: string }> {
  const Vapor = (await import("laravel-vapor")).default;
  const result = await Vapor.store(file, {
    baseURL: getApiBaseUrl(),
    ...(onProgress ? { progress: (p: number) => onProgress(Math.round(p * 100)) } : {}),
  });
  return {
    url: String(result.url ?? ""),
    key: String(result.key ?? ""),
    uuid: String(result.uuid ?? ""),
  };
}

async function buildUploadMetadata(
  input: TranscriptionRequest,
  onProgress?: (pct: number) => void
) {
  const uploadData = await uploadToStorage(input.file, onProgress);
  const formData = new FormData();
  const sourceCode = coerceApiLanguageCode(input.language);
  const translating = flagTruthy(input.translate);
  const targetTrim = String(input.targetLanguage ?? "").trim();
  const targetCode = targetTrim ? coerceApiLanguageCode(targetTrim) ?? null : null;

  formData.append("translate", translating ? "true" : "false");
  formData.append("summarize", flagTruthy(input.summarize) ? "true" : "false");
  if (translating) {
    if (targetCode) {
      formData.append("language", targetCode);
      formData.append("target_language", targetCode);
    }
    if (sourceCode) {
      formData.append("source_language", sourceCode);
    }
  } else if (sourceCode) {
    formData.append("language", sourceCode);
    formData.append("source_language", sourceCode);
  }
  formData.append("transcribe", "true");
  formData.append("is_meeting", "false");
  formData.append("include_audio_url", "true");
  formData.append("original_filename", input.file.name);
  formData.append("url", uploadData.url);
  formData.append("key", uploadData.key);
  formData.append("uuid", uploadData.uuid);
  if (input.style) formData.append("style", input.style);
  if (input.burnIn) formData.append("burn_in", "true");
  return formData;
}

export interface UploadSubmitResult {
  audioId: string;
  ts: string;
  dz: string;
  wantsWords: boolean;
  translationRequested: boolean;
  summaryRequested: boolean;
  initialPayload: unknown;
}

export const transcriptionApi = {
  /** Phase 1: upload file to S3 + submit job to backend. Returns audioId for polling. */
  uploadAndSubmit: async (
    input: TranscriptionRequest,
    onUploadProgress?: (pct: number) => void
  ): Promise<UploadSubmitResult> => {
    const ts = "true";
    const dz = input.diarization ? "true" : "false";
    const wantsWords = flagTruthy(ts) || flagTruthy(dz);
    const query = new URLSearchParams({ timestamp: ts, diarize: dz });
    const uploadPath = wantsWords
      ? `/upload-audio?${query.toString()}`
      : `/upload-audio/async?${query.toString()}`;

    const formData = await buildUploadMetadata(input, onUploadProgress);
    formData.append("timestamp", ts);
    formData.append("diarize", dz);
    if (wantsWords) formData.append("word_timestamps", "true");

    const uploadResponse = await apiClient.post(uploadPath, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    });

    const audioId = pickAudioId(uploadResponse.data);
    if (!audioId) throw new Error("MISSING_AUDIO_ID");

    const translationRequested =
      flagTruthy(input.translate) && String(input.targetLanguage ?? "").trim().length > 0;
    const summaryRequested = flagTruthy(input.summarize);

    const initialPayload =
      unwrapAudioResource(uploadResponse.data) ??
      uploadResponse.data?.data ??
      uploadResponse.data?.audio ??
      (uploadResponse.data && typeof uploadResponse.data === "object"
        ? uploadResponse.data
        : null);

    return { audioId, ts, dz, wantsWords, translationRequested, summaryRequested, initialPayload };
  },

  /** Phase 2: poll until transcript is ready. Runs in the background — continues if user navigates away. */
  pollForResult: async (
    audioId: string,
    opts: {
      ts: string;
      dz: string;
      wantsWords: boolean;
      translationRequested: boolean;
      summaryRequested: boolean;
      initialPayload?: unknown;
    }
  ): Promise<{ normalized: NormalizedTranscriptionPayload | null; audioId: string }> => {
    const { ts, dz, wantsWords, translationRequested, summaryRequested, initialPayload } = opts;
    const MAX_OPTIONAL_FIELD_STALL_POLLS = 72;

    const baseTranscriptReady = (n: NormalizedTranscriptionPayload | null) => {
      if (!n) return false;
      const hasText = Boolean(n.transcriptionText?.trim());
      const wordsOk = Array.isArray(n.timestampPayload) && n.timestampPayload!.length > 0;
      return hasText && (!wantsWords || wordsOk);
    };

    const optionalFieldsFilled = (n: NormalizedTranscriptionPayload | null) => {
      const trOk = !translationRequested || Boolean(String(n?.translation ?? "").trim());
      const sumOk = !summaryRequested || Boolean(String(n?.summary ?? "").trim());
      return trOk && sumOk;
    };

    let normalized = initialPayload ? normalizeTranscriptionPayload(initialPayload) : null;
    let optionalFieldStallPolls = 0;

    const maybeFinish = (): { normalized: NormalizedTranscriptionPayload; audioId: string } | null => {
      if (!baseTranscriptReady(normalized)) return null;
      if (!optionalFieldsFilled(normalized)) {
        optionalFieldStallPolls += 1;
        if (optionalFieldStallPolls < MAX_OPTIONAL_FIELD_STALL_POLLS) return null;
      }
      if (!normalized) return null;
      return { normalized, audioId };
    };

    const immediate = maybeFinish();
    if (immediate) return immediate;

    const maxAttempts = 180;
    const intervalMs = 5000;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await sleep(intervalMs);
      const poll = await apiClient.get(`/audios/${audioId}`, {
        params: { ...audioResourceDetailParams, timestamp: ts, diarize: dz },
        timeout: 60_000,
      });
      const pollPayload = unwrapAudioResource(poll.data) ?? poll.data?.data ?? poll.data;
      normalized = normalizeTranscriptionPayload(pollPayload);
      const done = maybeFinish();
      if (done) return done;
    }

    throw new Error("POLL_TIMEOUT");
  },

  /** Convenience: upload + submit + poll in one call (backward compat). */
  submitUploadThenPoll: async (
    input: TranscriptionRequest
  ): Promise<{ normalized: NormalizedTranscriptionPayload | null; audioId: string }> => {
    const submitResult = await transcriptionApi.uploadAndSubmit(input);
    return transcriptionApi.pollForResult(submitResult.audioId, submitResult);
  },

  subtitleFallback: async (input: TranscriptionRequest) => {
    const query = new URLSearchParams({
      timestamp: "true",
      diarize: input.diarization ? "true" : "false",
    });
    const formData = await buildUploadMetadata(input);
    formData.append("word_timestamps", "true");
    return apiClient.post(`/audio/subtitle?${query.toString()}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 900_000,
    });
  },

  getAudioById: async (audioId: string) => {
    const response = await apiClient.get(`/audios/${audioId}`, {
      params: audioResourceDetailParams,
    });
    const payload = unwrapAudioResource(response.data) ?? response.data?.data ?? response.data;
    return normalizeTranscriptionPayload(payload);
  },

  getAudioFileUrl: async (audioId: string): Promise<string> => {
    const safe = (v: unknown): string => (typeof v === "string" ? v : "");
    try {
      const response = await apiClient.get(`/audios/${audioId}/file`);
      if (typeof response.data === "string") return response.data;
      return (
        safe(response.data?.url) ||
        safe(response.data?.file_url) ||
        safe(response.data?.audio_url) ||
        safe(response.data?.audio_file_url) ||
        safe(response.data?.data?.url) ||
        safe(response.data?.data?.audio_url)
      );
    } catch {
      const detail = await apiClient.get(`/audios/${audioId}`, { params: audioResourceDetailParams });
      const normalized = normalizeTranscriptionPayload(
        unwrapAudioResource(detail.data) ?? detail.data?.data ?? detail.data
      );
      return normalized?.audioUrl ?? "";
    }
  },
};
