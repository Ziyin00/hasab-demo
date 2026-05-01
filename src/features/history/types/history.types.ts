export interface HistoryItem {
  id: string;
  type: "transcription" | "translation" | "tts" | "meeting";
  title: string;
  status: "completed" | "processing" | "failed";
  createdAt: string;
}

export interface HistoryDetail extends HistoryItem {
  content: string;
  metadata: Record<string, any>;
}
