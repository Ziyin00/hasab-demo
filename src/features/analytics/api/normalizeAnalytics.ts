import type {
  AnalyticsData,
  AnalyticsSummary,
  ClassificationCoverage,
  ResponseTimeStats,
  TrendPoint,
} from "../types/analytics.types";

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeSummary(raw: Partial<AnalyticsSummary> | undefined): AnalyticsSummary {
  const changes = raw?.changes;
  return {
    total_messages: num(raw?.total_messages),
    total_conversations: num(raw?.total_conversations),
    conversations_replied: num(raw?.conversations_replied),
    conversations_abandoned: num(raw?.conversations_abandoned),
    unique_visitors: num(raw?.unique_visitors),
    returning_visitors: num(raw?.returning_visitors),
    positive_ratings: num(raw?.positive_ratings),
    negative_ratings: num(raw?.negative_ratings),
    uncategorized_conversations: num(raw?.uncategorized_conversations),
    avg_messages_per_conversation: num(raw?.avg_messages_per_conversation),
    avg_response_time_ms: num(raw?.avg_response_time_ms),
    avg_response_time_display: raw?.avg_response_time_display ?? "—",
    satisfaction_rate: raw?.satisfaction_rate ?? null,
    satisfaction_sample_size: num(raw?.satisfaction_sample_size),
    changes: {
      messages_percent: num(changes?.messages_percent),
      conversations_percent: num(changes?.conversations_percent),
      satisfaction_percent: changes?.satisfaction_percent ?? null,
      response_time_percent: changes?.response_time_percent ?? null,
    },
  };
}

function normalizeTrend(points: Partial<TrendPoint>[] | undefined): TrendPoint[] {
  return (points ?? []).map((point) => {
    const conversations = num(point.conversations ?? point.conversations_started);
    return {
      date: point.date ?? "",
      label: point.label ?? "",
      conversations_started: num(point.conversations_started, conversations),
      conversations,
      conversations_replied: num(point.conversations_replied),
      conversations_abandoned: num(point.conversations_abandoned),
      messages: num(point.messages),
      user_messages: num(point.user_messages),
      assistant_messages: num(point.assistant_messages),
      unique_visitors: num(point.unique_visitors),
      avg_response_time_ms: point.avg_response_time_ms ?? null,
      ratings_positive: num(point.ratings_positive),
      ratings_negative: num(point.ratings_negative),
      satisfaction_rate: point.satisfaction_rate ?? null,
    };
  });
}

function normalizeResponseTime(raw: Partial<ResponseTimeStats> | undefined): ResponseTimeStats {
  return {
    avg_ms: raw?.avg_ms ?? null,
    p50_ms: raw?.p50_ms ?? null,
    p95_ms: raw?.p95_ms ?? null,
    display: raw?.display ?? null,
  };
}

function normalizeClassificationCoverage(
  raw: Partial<ClassificationCoverage> | undefined
): ClassificationCoverage {
  const classified = num(raw?.classified);
  const total = num(raw?.total);
  const percent = raw?.percent ?? (total > 0 ? classified / total : 0);
  return {
    classified,
    total,
    percent,
    display: raw?.display ?? (total > 0 ? `${(percent * 100).toFixed(1)}% classified` : "0% classified"),
  };
}

/** Coerce partial API payloads into a complete AnalyticsData shape. */
export function normalizeAnalyticsData(raw: Partial<AnalyticsData>): AnalyticsData {
  return {
    range: raw.range ?? "30d",
    from: raw.from ?? "",
    to: raw.to ?? "",
    chatbot_widget_id: raw.chatbot_widget_id ?? null,
    summary: normalizeSummary(raw.summary),
    trend: normalizeTrend(raw.trend),
    by_category: raw.by_category ?? [],
    by_source: raw.by_source ?? [],
    by_language: raw.by_language ?? [],
    by_device: raw.by_device ?? [],
    top_pages: raw.top_pages ?? [],
    by_hour: raw.by_hour ?? [],
    response_time: normalizeResponseTime(raw.response_time),
    classification_coverage: normalizeClassificationCoverage(raw.classification_coverage),
    widget_status: raw.widget_status ?? null,
    last_updated: raw.last_updated ?? "",
  };
}
