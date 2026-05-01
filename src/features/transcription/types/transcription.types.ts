export interface TranscriptionRequest {
  file: File;
  language?: string;
  style?: string;
  burnIn: boolean;
  diarization?: boolean;
  summarize?: boolean;
  translate?: boolean;
  targetLanguage?: string;
}

export interface TranscriptionResponse {
  id: string;
  text?: string;
  videoUrl?: string;
  srtUrl?: string;
  vttUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface TranscriptionWordTimestamp {
  text?: string;
  content?: string;
  start?: number;
  end?: number;
  start_time?: number;
  end_time?: number;
  speaker?: string | number | null;
}

export interface NormalizedTranscriptionPayload {
  transcriptionText: string;
  timestampPayload: TranscriptionWordTimestamp[] | null;
  numSpeakers: number | null;
  transcriptionLang: string | null;
  translation: string | null;
  summary: string | null;
  audioUrl: string | null;
  audioId: string | number | null;
  originalFilename: string | null;
  fileSize: number | null;
}

/** Grouped transcript workspace (paragraph / time bucket / character limit) */
export type TranscriptGroupMode = "time" | "character" | "paragraph";

export type TranscriptWorkspaceRow = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speaker?: string;
  text: string;
  segmentIds: string[];
  words: Array<{
    text: string;
    start: number;
    end: number;
  }>;
};

export type TranscriptSpeakerBlock = {
  speakerKey: string;
  startSeconds: number;
  endSeconds: number;
  rows: TranscriptWorkspaceRow[];
};
