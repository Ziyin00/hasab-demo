"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
  children: ReactNode;
  className?: string;
  /** Fixed chart height in px */
  height?: number;
}

/**
 * Measures the parent width, then mounts Recharts with numeric width/height.
 * Avoids ResponsiveContainer's default initialDimension (-1,-1) warning.
 */
export function ChartContainer({
  children,
  className,
  height = 240,
}: ChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setWidth(Math.max(0, Math.round(el.getBoundingClientRect().width)));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", height, minWidth: 0, minHeight: height }}
    >
      {width > 0 ? (
        <ResponsiveContainer width={width} height={height}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
