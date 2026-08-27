/** Brand-aligned palette for analytics charts and accents */
export const ANALYTICS_COLORS = {
  primary: "#7C20D0",
  primaryLight: "#9D4EDD",
  indigo: "#6366F1",
  violet: "#A855F7",
  sky: "#0EA5E9",
  teal: "#14B8A6",
  green: "#22C55E",
  amber: "#F59E0B",
  orange: "#F97316",
  rose: "#EC4899",
} as const;

export const CHART_PALETTE = [
  ANALYTICS_COLORS.primary,
  ANALYTICS_COLORS.violet,
  ANALYTICS_COLORS.indigo,
  ANALYTICS_COLORS.sky,
  ANALYTICS_COLORS.teal,
  ANALYTICS_COLORS.orange,
  ANALYTICS_COLORS.rose,
] as const;
