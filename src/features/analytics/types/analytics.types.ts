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

export interface Conversation {
  id: number;
  title: string;
  model: string | null;
  visitor_session_id: string | null;
  source: string | null;
  page_url: string | null;
  language: string | null;
  satisfaction_rating: "positive" | "negative" | null;
  message_count: number;
  last_message_preview: string | null;
  last_message_role: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  response_time_ms: number | null;
  created_at: string;
}

export interface ConversationDetail {
  id: number;
  title: string;
  visitor_session_id: string | null;
  source: string | null;
  page_url: string | null;
  language: string | null;
  satisfaction_rating: "positive" | "negative" | null;
  message_count: number;
  messages: ConversationMessage[];
}

export interface ConversationsPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ConversationsData {
  conversations: Conversation[];
  pagination: ConversationsPagination;
}

export interface ConversationsFilter {
  range?: AnalyticsRange;
  page?: number;
  per_page?: number;
  search?: string;
  source?: string;
  satisfaction_rating?: string;
}
