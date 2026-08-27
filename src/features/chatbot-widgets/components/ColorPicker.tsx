"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Contrast } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

export function hexToHsva(hex: string): Hsva {
  const cleaned = hex.trim().replace("#", "");
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 1;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6 || cleaned.length === 8) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
    if (cleaned.length === 8) a = parseInt(cleaned.slice(6, 8), 16) / 255;
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  const s = max === 0 ? 0 : d / max;
  return { h: h * 360, s, v: max, a: Number.isFinite(a) ? a : 1 };
}

function hsvaToRgb({ h, s, v }: Hsva) {
  const hh = ((h % 360) + 360) % 360 / 60;
  const c = v * s;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = v - c;

  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function hsvaToHex({ h, s, v, a }: Hsva, includeAlpha = false): string {
  const { r, g, b } = hsvaToRgb({ h, s, v, a });
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (includeAlpha && a < 0.999) return `${hex}${toHex(Math.round(a * 255))}`;
  return hex;
}

function usePointerDrag(
  onMove: (clientX: number, clientY: number) => void
) {
  const dragging = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      onMove(e.clientX, e.clientY);
    },
    [onMove]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      onMove(e.clientX, e.clientY);
    },
    [onMove]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  /** Optional label shown in the header, e.g. "Primary Color" */
  label?: string;
  className?: string;
}

export function ColorPicker({ value, onChange, label, className }: ColorPickerProps) {
  const [hsva, setHsva] = useState(() => hexToHsva(value || "#000000"));
  const hsvaRef = useRef(hsva);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hsvaRef.current = hsva;
  }, [hsva]);

  // Sync from external value when it changes (e.g. typing in hex input)
  useEffect(() => {
    const next = hexToHsva(value || "#000000");
    setHsva((prev) => {
      const same =
        Math.abs(prev.h - next.h) < 0.5 &&
        Math.abs(prev.s - next.s) < 0.01 &&
        Math.abs(prev.v - next.v) < 0.01 &&
        Math.abs(prev.a - next.a) < 0.01;
      return same ? prev : next;
    });
  }, [value]);

  const commit = useCallback(
    (next: Hsva) => {
      hsvaRef.current = next;
      setHsva(next);
      onChange(hsvaToHex(next, true));
    },
    [onChange]
  );

  const updateSv = useCallback(
    (clientX: number, clientY: number) => {
      const el = svRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = clamp((clientX - rect.left) / rect.width);
      const v = clamp(1 - (clientY - rect.top) / rect.height);
      commit({ ...hsvaRef.current, s, v });
    },
    [commit]
  );

  const updateHue = useCallback(
    (_clientX: number, clientY: number) => {
      const el = hueRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const h = clamp((clientY - rect.top) / rect.height) * 360;
      commit({ ...hsvaRef.current, h });
    },
    [commit]
  );

  const updateAlpha = useCallback(
    (_clientX: number, clientY: number) => {
      const el = alphaRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const a = clamp(1 - (clientY - rect.top) / rect.height);
      commit({ ...hsvaRef.current, a });
    },
    [commit]
  );

  const svDrag = usePointerDrag(updateSv);
  const hueDrag = usePointerDrag(updateHue);
  const alphaDrag = usePointerDrag(updateAlpha);

  const hueColor = `hsl(${hsva.h}, 100%, 50%)`;
  const solidHex = hsvaToHex({ ...hsva, a: 1 });
  const displayHex = hsvaToHex(hsva, true);
  const headerText = label ? `${label} · ${displayHex}` : displayHex;

  return (
    <div
      className={cn(
        "w-[240px] overflow-hidden rounded-md border border-border bg-[#252526] text-[#cccccc] shadow-xl",
        className
      )}
    >
      {/* Header — VS Code style */}
      <div className="flex items-center gap-2 border-b border-white/10 px-2.5 py-1.5">
        <Contrast className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className="truncate font-mono text-[11px] leading-none tracking-tight">
          {headerText}
        </span>
      </div>

      <div className="flex gap-2 p-2.5">
        {/* Saturation / Value square */}
        <div
          ref={svRef}
          className="relative h-[160px] w-[160px] shrink-0 cursor-crosshair touch-none rounded-sm"
          style={{
            background: `
              linear-gradient(to top, #000, transparent),
              linear-gradient(to right, #fff, ${hueColor})
            `,
          }}
          {...svDrag}
        >
          <div
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
            style={{
              left: `${hsva.s * 100}%`,
              top: `${(1 - hsva.v) * 100}%`,
            }}
          />
        </div>

        {/* Alpha slider */}
        <div
          ref={alphaRef}
          className="relative h-[160px] w-3.5 shrink-0 cursor-ns-resize touch-none overflow-hidden rounded-sm"
          style={{
            backgroundImage: `
              linear-gradient(to bottom, ${solidHex}, transparent),
              linear-gradient(45deg, #555 25%, transparent 25%),
              linear-gradient(-45deg, #555 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #555 75%),
              linear-gradient(-45deg, transparent 75%, #555 75%)
            `,
            backgroundSize: "100% 100%, 8px 8px, 8px 8px, 8px 8px, 8px 8px",
            backgroundPosition: "0 0, 0 0, 0 4px, 4px -4px, -4px 0",
            backgroundColor: "#333",
          }}
          {...alphaDrag}
        >
          <div
            className="pointer-events-none absolute left-0 right-0 h-1 -translate-y-1/2 rounded-[1px] border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
            style={{ top: `${(1 - hsva.a) * 100}%` }}
          />
        </div>

        {/* Hue slider */}
        <div
          ref={hueRef}
          className="relative h-[160px] w-3.5 shrink-0 cursor-ns-resize touch-none rounded-sm"
          style={{
            background:
              "linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
          }}
          {...hueDrag}
        >
          <div
            className="pointer-events-none absolute left-0 right-0 h-1 -translate-y-1/2 rounded-[1px] border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
            style={{ top: `${(hsva.h / 360) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
