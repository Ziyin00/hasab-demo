export interface MeetingRequest {
  file: File;
  template?: string;
  includeActionItems: boolean;
}

export interface MeetingResponse {
  id: string;
  summary: string;
  actionItems: string[];
  status: "pending" | "processing" | "completed" | "failed";
}
