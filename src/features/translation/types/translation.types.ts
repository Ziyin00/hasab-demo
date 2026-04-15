import { translationConfig } from "../config/translation.config";

export interface TranslationRequest {
  file?: File;
  text?: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  id: string;
  translatedText?: string;
  status: "pending" | "processing" | "completed" | "failed";
}
