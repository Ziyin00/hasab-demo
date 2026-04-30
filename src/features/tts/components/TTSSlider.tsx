"use client";

import { Slider } from "@/components/ui/slider";

interface TTSSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

export function TTSSlider({ label, value, onChange, min, max, step }: TTSSliderProps) {
  const display = Number.isInteger(value) ? value : value.toFixed(1);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground tabular-nums w-8 text-right">
          {display}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}
