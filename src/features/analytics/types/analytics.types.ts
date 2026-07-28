import type { ClientMetadata } from "@/lib/client-metadata";

export type AnalyticsRange = "7d" | "14d" | "30d" | "90d";

export interface AnalyticsSummary {
  total_messages: number;
  total_conversations: number;
  conversations_replied: number;
  conversations_abandoned: number;
  unique_visitors: number;
  returning_visitors: number;
  positive_ratings: number;
  negative_ratings: number;
  uncategorized_conversations: number;
  avg_messages_per_conversation: number;
  avg_response_time_ms: number;
  avg_response_time_display: string;
  /** Fraction of rated conversations that are positive (0–1), or null if none rated. */
  satisfaction_rate: number | null;
  satisfaction_sample_size: number;
  changes: {
    messages_percent: number;
    conversations_percent: number;
    satisfaction_percent: number | null;
    response_time_percent: number | null;
  };
}

export interface TrendPoint {
  date: string;
  label: string;
  conversations_started: number;
  conversations: number;
  conversations_replied: number;
  conversations_abandoned: number;
  messages: number;
  user_messages: number;
  assistant_messages: number;
  unique_visitors: number;
  avg_response_time_ms: number | null;
  ratings_positive: number;
  ratings_negative: number;
  satisfaction_rate: number | null;
}

export interface CategoryBreakdown {
  category_id: number | null;
  name: string;
  slug: string;
  conversations_count: number;
  /** Fraction 0–1 */
  share: number;
}

export interface SourceBreakdown {
  source: string;
  conversations_count: number;
  /** Fraction 0–1 */
  share: number;
}

export interface LanguageBreakdown {
  language: string;
  conversations_count: number;
  /** Fraction 0–1 */
  share: number;
}

export interface DeviceBreakdown {
  device_type: string;
  conversations_count: number;
  /** Fraction 0–1 */
  share: number;
}

export interface TopPage {
  page_url: string;
  conversations_count: number;
}

export interface HourBucket {
  hour: number;
  label: string;
  conversations_count: number;
  messages_count: number;
}

export interface ResponseTimeStats {
  avg_ms: number | null;
  p50_ms: number | null;
  p95_ms: number | null;
  display: string | null;
}

export interface ClassificationCoverage {
  classified: number;
  total: number;
  /** Fraction 0–1 */
  percent: number;
  display: string;
}

export interface WidgetStatusInfo {
  id: number;
  widget_id: string;
  name: string;
  is_active: boolean;
}

export interface WidgetStatus {
  widget: WidgetStatusInfo | null;
  last_conversation_at: string | null;
  conversations_last_24h: number;
  messages_last_24h: number;
  avg_response_time_ms_last_24h: number | null;
  classification_backlog: number;
  /** Fraction 0–1 */
  uncategorized_share_last_7d: number;
}

export interface AnalyticsData {
  range: AnalyticsRange;
  from: string;
  to: string;
  chatbot_widget_id: number | null;
  summary: AnalyticsSummary;
  trend: TrendPoint[];
  by_category: CategoryBreakdown[];
  by_source: SourceBreakdown[];
  by_language: LanguageBreakdown[];
  by_device: DeviceBreakdown[];
  top_pages: TopPage[];
  by_hour: HourBucket[];
  response_time: ResponseTimeStats;
  classification_coverage: ClassificationCoverage;
  widget_status: WidgetStatus | null;
  last_updated: string;
}

export interface ConversationCategory {
  id: number | null;
  name: string;
  slug: string;
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
