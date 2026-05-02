import { apiClient } from "@/lib/api-client";
import type { TranslationApiResponse, TranslationTexts } from "../types/translation.types";
import type { TranslationApiStoredBody } from "../utils/translationResultPayload";
import { translateLanguageForApi } from "../utils/translateApiLanguages";

function pickTextsFromBag(bag: unknown): TranslationTexts | null {
  if (!bag || typeof bag !== "object") return null;
  const r = bag as Record<string, unknown>;
  const source = r.source_text ?? r.sourceText ?? "";
  const translated = r.translated_text ?? r.translatedText ?? r.translation ?? "";
  const s = typeof source === "string" ? source : "";
  const t = typeof translated === "string" ? translated : "";
  if (!s.trim() && !t.trim()) return null;
  return { sourceText: s, translatedText: t };
}

/** Normalize various API envelope shapes → plain strings for the UI. */
export function normalizeTranslationResponse(payload: TranslationApiResponse | unknown): TranslationTexts | null {
  if (payload == null || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>;
    const tr = inner.translation;
    const fromNested = pickTextsFromBag(tr);
    if (fromNested) return fromNested;
    const direct = pickTextsFromBag(inner);
    if (direct) return direct;
  }
  const flat = pickTextsFromBag(root.translation);
  if (flat) return flat;
  return pickTextsFromBag(root);
}

export async function postTextTranslation(input: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}): Promise<{ texts: TranslationTexts; raw: TranslationApiStoredBody }> {
  const target = translateLanguageForApi(input.targetLanguage);
  if (!target) {
    throw new Error("MISSING_TARGET_LANGUAGE");
  }

  const formData = new FormData();
  formData.append("text", input.text);
  /** Backend typically rejects `"auto"`; omit field for auto-detect (same pattern as transcription). */
  const source = translateLanguageForApi(input.sourceLanguage);
  if (source) {
    formData.append("source_language", source);
  }
  formData.append("target_language", target);

  /** Clear default `application/json` so Axios sets multipart boundary on FormData. */
  const res = await apiClient.post("/translate", formData, {
    timeout: 120_000,
    headers: {
      "Content-Type": undefined,
    },
  });

  const normalized = normalizeTranslationResponse(res.data);
  if (!normalized) {
    throw new Error("EMPTY_TRANSLATION_RESPONSE");
  }

  return { texts: normalized, raw: res.data as TranslationApiStoredBody };
}
