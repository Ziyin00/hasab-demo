export interface HistoryItem {
  id: string;
  type: "transcription" | "translation" | "tts" | "meeting";
  title: string;
  status: "completed" | "processing" | "failed";
  createdAt: string;
}

export interface HistoryDetail extends HistoryItem {
  content: string;
  metadata: Record<string, unknown>;
}

export interface TimestampItem {
  index: number;
  start: number;
  end: number;
  content: string;
  speaker: string;
}

export interface TranscriptionRecord {
  id: number;
  user_id: number;
  device_id: string | null;
  filename: string;
  original_filename: string;
  mime_type: string;
  duration_in_seconds: string;
  file_size: number;
  description: string | null;
  transcription: string;
  translation: string;
  summary: string;
  audio_type: string | null;
  is_meeting: boolean;
  created_at: string;
  updated_at: string;
  tokens_used: string;
  processing_status: "completed" | "processing" | "failed" | "pending";
  processing_error: string | null;
  audio_url: string;
  subtitle_url: string | null;
  timestamp: TimestampItem[];
  num_speakers: number;
  user: { id: number; name: string; email: string };
}

export interface TranscriptionPage {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: TranscriptionRecord[];
}

export interface TranslationRecord {
  id: number;
  user_id: number;
  device_id: string | null;
  source_text: string;
  source_language: string;
  target_language: string;
  translated_text: string;
  success: boolean;
  error_message: string | null;
  character_count: number;
  created_at: string;
  updated_at: string;
}

export interface TranslationPage {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: TranslationRecord[];
}
