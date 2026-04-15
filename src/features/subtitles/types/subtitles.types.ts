export interface SubtitlesRequest {
  file: File;
  style?: string;
  burnIn: boolean;
}

export interface SubtitlesResponse {
  id: string;
  videoUrl?: string;
  srtUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
}
