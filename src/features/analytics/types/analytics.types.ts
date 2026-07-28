import type { ClientMetadata } from "@/lib/client-metadata";

export type AnalyticsRange = "7d" | "14d" | "30d" | "90d";

export interface AnalyticsSummary {
  total_messages: number;
  total_conversations: number;
  avg_response_time_ms: number;
  avg_response_time_display: string;
  /** Fraction of rated conversations that are positive (0–1), or null if none rated. */
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

export interface CategoryBreakdown {
  category_id: number | null;
  name: string;
  slug: string;
  conversations_count: number;
  share: number;
}

export interface AnalyticsData {
  range: AnalyticsRange;
  from: string;
  to: string;
  summary: AnalyticsSummary;
  trend: TrendPoint[];
  by_category: CategoryBreakdown[];
  last_updated: string;
}

export interface ConversationCategory {
  id: number | null;
  name: string;
  slug: string; // "uncategorized" when id is null
}

export interface ConversationWidgetRef {
  id: number;
  widget_id: string;
  name: string;
}

export interface Conversation {
  id: number;
  title: string;
  model: string | null;
  visitor_session_id: string | null;
  source: string | null;
  page_url: string | null;
  language: string | null;
  client_ip: string | null;
  user_agent: string | null;
  referrer: string | null;
  origin: string | null;
  client_metadata: ClientMetadata | null;
  satisfaction_rating: "positive" | "negative" | null;
  message_count: number;
  last_message_preview: string | null;
  last_message_role: string | null;
  category: ConversationCategory | null;
  category_confidence: number | null;
  category_source: "auto" | "manual" | null;
  categorized_at: string | null;
  chatbot_widget_id: number | null;
  chatbot_widget: ConversationWidgetRef | null;
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
  client_ip: string | null;
  user_agent: string | null;
  referrer: string | null;
  origin: string | null;
  client_metadata: ClientMetadata | null;
  satisfaction_rating: "positive" | "negative" | null;
  message_count: number;
  category: ConversationCategory | null;
  category_confidence: number | null;
  category_source: "auto" | "manual" | null;
  categorized_at: string | null;
  chatbot_widget_id: number | null;
  chatbot_widget: ConversationWidgetRef | null;
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
  category_id?: number;
  category?: "uncategorized";
  chatbot_widget_id?: number;
}
