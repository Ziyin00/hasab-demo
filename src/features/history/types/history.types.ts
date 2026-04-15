export interface HistoryItem {
  id: string;
  type: "transcription" | "translation" | "tts" | "meeting" | "subtitles";
  title: string;
  status: "completed" | "processing" | "failed";
  createdAt: string;
}

export interface HistoryDetail extends HistoryItem {
  content: string;
  metadata: Record<string, any>;
}
