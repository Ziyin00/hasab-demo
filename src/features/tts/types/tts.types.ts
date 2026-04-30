export interface TTSSpeakersResponse {
  languages: Record<string, string[]>;
  total_speakers: number;
}

export interface TTSHistoryRecord {
  id: number;
  text: string;
  language: string;
  speaker_name: string;
  status: "success" | "failed";
  audio_url: string;
  tokens_used: number;
  created_at: string;
}

export interface TTSHistoryResponse {
  records: TTSHistoryRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface TTSHistoryParams {
  limit?: number;
  offset?: number;
  status?: "success" | "failed";
  language?: string;
  date_from?: string;
  date_to?: string;
}
