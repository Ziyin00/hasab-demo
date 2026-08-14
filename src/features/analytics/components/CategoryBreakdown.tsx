"use client";

import { useMemo } from "react";
import { Tags } from "lucide-react";
import type { CategoryBreakdown as CategoryBreakdownItem } from "../types/analytics.types";
import { ShareBreakdown } from "./ShareBreakdown";

interface CategoryBreakdownProps {
  data: CategoryBreakdownItem[];
  loading?: boolean;
}

export function CategoryBreakdown({ data, loading }: CategoryBreakdownProps) {
  const items = useMemo(
    () =>
      data.map((d) => ({
        key: d.slug,
        label: d.name,
        conversations_count: d.conversations_count,
        share: d.share,
      }))
      .filter((d) => d.conversations_count > 0),
    [data]
  );

  const mutedKeys = useMemo(
    () => new Set(data.filter((d) => d.category_id === null).map((d) => d.slug)),
    [data]
  );

  return (
    <ShareBreakdown
      data={items}
      loading={loading}
      ranked
      mutedKeys={mutedKeys}
      accentGradient
      emptyIcon={Tags}
      emptyMessage="No categorized conversations in this range yet."
    />
  );
}
