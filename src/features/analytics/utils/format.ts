/** Format a 0–1 API rate as a percent string. */
export function toPercent(rate: number | null | undefined, digits = 0): string {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(digits)}%`;
}

/** Format signed change values that are already percentages (e.g. changes.*_percent). */
export function formatSignedPercent(value: number | null | undefined, digits = 1): string {
  if (value == null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(digits)}%`;
}

export function truncateUrl(url: string, max = 48): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

export function formatSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    widget: "Widget",
    web: "Web",
    mobile: "Mobile",
    dashboard: "Dashboard",
    telegram: "Telegram",
    unknown: "Unknown",
  };
  return labels[source] ?? source;
}

export function formatDeviceLabel(device: string): string {
  const labels: Record<string, string> = {
    desktop: "Desktop",
    mobile: "Mobile",
    tablet: "Tablet",
    unknown: "Unknown",
  };
  return labels[device] ?? device;
}

export function formatLanguageLabel(language: string): string {
  const labels: Record<string, string> = {
    en: "English",
    am: "Amharic",
    ti: "Tigrinya",
    om: "Oromo",
    unknown: "Unknown",
  };
  return labels[language] ?? language.toUpperCase();
}

export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export interface ShareBreakdownItem {
  key: string;
  label: string;
  conversations_count: number;
  share: number;
}

export function toShareItems<T extends { conversations_count: number; share: number }>(
  rows: T[] | undefined,
  getKey: (row: T) => string,
  getLabel: (row: T) => string
): ShareBreakdownItem[] {
  return (rows ?? [])
    .filter((row) => row.conversations_count > 0)
    .map((row) => ({
      key: getKey(row),
      label: getLabel(row),
      conversations_count: row.conversations_count,
      share: row.share,
    }));
}
