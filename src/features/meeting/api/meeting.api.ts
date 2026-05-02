import { apiClient } from "@/lib/api-client";
import { coerceApiLanguageCode } from "@/features/transcription/config/transcriptionApiLanguages";
import {
  normalizeTranscriptionPayload,
  unwrapAudioResource,
} from "@/features/transcription/utils/normalizeTranscriptionPayload";
import { transcriptionApi } from "@/features/transcription/api/transcription.api";

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
  onProgress?: (ratio: number) => void
): Promise<{ url: string; key: string; uuid: string }> {
  const Vapor = (await import("laravel-vapor")).default;
  const result = await Vapor.store(file, {
    baseURL: getApiBaseUrl(),
    ...(onProgress ? { progress: onProgress } : {}),
  });
  return {
    url: String(result.url ?? ""),
    key: String(result.key ?? ""),
    uuid: String(result.uuid ?? ""),
  };
}

function pickNestedAudioUrl(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const r = body as Record<string, unknown>;
  const audio = r.audio;
  if (audio && typeof audio === "object") {
    const a = audio as Record<string, unknown>;
    for (const k of ["audio_url", "url", "file_url"]) {
      const v = a[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  for (const k of ["audio_url", "file_url", "url"]) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickAudioIdFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const r = body as Record<string, unknown>;
  const audio = r.audio;
  if (audio && typeof audio === "object") {
    const id = (audio as Record<string, unknown>).id ?? (audio as Record<string, unknown>).audio_id;
    if (id != null) return String(id);
  }
  const top = r.id ?? r.audio_id ?? r.audioId;
  return top != null ? String(top) : null;
}

export type MeetingUploadParsed = {
  raw: unknown;
  summary: string;
  audioUrl: string | null;
  audioId: string | null;
  message: string | null;
  s3Url: string;
};

export async function submitMeetingMinutesUpload(input: {
  file: File;
  /** UI value like `amh` / `eng` — coerced for API */
  language: string;
  onUploadProgress?: (percent: number) => void;
}): Promise<MeetingUploadParsed> {
  const uploadData = await uploadToStorage(input.file, (ratio) => {
    input.onUploadProgress?.(Math.round(Math.max(0, Math.min(1, ratio)) * 100));
  });

  const lang = coerceApiLanguageCode(input.language);
  const formData = new FormData();
  formData.append("transcribe", "true");
  formData.append("is_meeting", "true");
  formData.append("summarize", "true");
  formData.append("translate", "false");
  formData.append("include_audio_url", "true");
  if (lang) {
    formData.append("language", lang);
    formData.append("summary_language", lang);
  }
  formData.append("original_filename", input.file.name);
  formData.append("url", uploadData.url);
  formData.append("key", uploadData.key);
  formData.append("uuid", uploadData.uuid);

  const res = await apiClient.post("/upload-audio", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 600_000,
  });

  const data = res.data;
  const unwrapped = unwrapAudioResource(data) ?? (data as Record<string, unknown>)?.data ?? data;
  const normalized = normalizeTranscriptionPayload(unwrapped);

  const nestedUrl = pickNestedAudioUrl(data) ?? pickNestedAudioUrl(unwrapped);
  const audioId = pickAudioIdFromBody(data) ?? (normalized?.audioId != null ? String(normalized.audioId) : null);

  let audioUrl =
    nestedUrl ||
    normalized?.audioUrl ||
    (typeof (unwrapped as Record<string, unknown>)?.audio_url === "string"
      ? String((unwrapped as Record<string, unknown>).audio_url)
      : null);

  if (!audioUrl && audioId) {
    try {
      const fetched = await transcriptionApi.getAudioFileUrl(audioId);
      if (fetched) audioUrl = fetched;
    } catch {
      /* use S3 below */
    }
  }
  if (!audioUrl) {
    audioUrl = uploadData.url || null;
  }

  const summary =
    (normalized?.summary && String(normalized.summary).trim()) ||
    (typeof (data as Record<string, unknown>)?.summary === "string"
      ? String((data as Record<string, unknown>).summary).trim()
      : "") ||
    "";

  const message =
    (typeof (data as Record<string, unknown>)?.message === "string" && (data as Record<string, unknown>).message) ||
    (typeof (unwrapped as Record<string, unknown>)?.message === "string" &&
      (unwrapped as Record<string, unknown>).message) ||
    null;

  return {
    raw: data,
    summary,
    audioUrl,
    audioId,
    message: message ? String(message) : null,
    s3Url: uploadData.url,
  };
}
