export type TranscriptionType = "transcription";

export interface TranscriptionRequest {
  file: File;
  language?: string;
  diarization?: boolean;
}

export interface TranscriptionResponse {
  id: string;
  text: string;
  status: "pending" | "processing" | "completed" | "failed";
}
