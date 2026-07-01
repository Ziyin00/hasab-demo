export type AnalyticsRange = "7d" | "14d" | "30d" | "90d";

export interface AnalyticsSummary {
  total_messages: number;
  total_conversations: number;
  avg_response_time_ms: number;
  avg_response_time_display: string;
  satisfaction_rate: number | null;
  satisfaction_sample_size: number;
  changes: {
    messages_percent: number;
    conversations_percent: number;
  };
}

export interface TrendPoint {
  date: string;
  label: string;
  messages: number;
  conversations: number;
}

export interface AnalyticsData {
  range: AnalyticsRange;
  from: string;
  to: string;
  summary: AnalyticsSummary;
  trend: TrendPoint[];
  last_updated: string;
}
