export interface TTSRequest {
  text: string;
  voice: string;
  speed: number;
}

export interface TTSResponse {
  id: string;
  audioUrl: string;
  status: "pending" | "processing" | "completed" | "failed";
}
