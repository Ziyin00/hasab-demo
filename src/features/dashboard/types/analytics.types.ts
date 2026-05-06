export interface AnalyticsData {
  audio_minutes: number;
  meeting_minutes: number;
  video_minutes: number;
  total_minutes: number;
  words_processed: {
    total: number;
    breakdown: {
      translation: number;
      summary: number;
    };
  };
  videos_processed: number;
  last_updated: string;
}

export interface AnalyticsResponse {
  status: string;
  data: AnalyticsData;
  message: string;
  code: number;
  request_id: string;
}
