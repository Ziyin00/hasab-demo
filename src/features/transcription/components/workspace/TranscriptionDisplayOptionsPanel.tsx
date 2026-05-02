"use client";

import { CaseSensitive, Pilcrow, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { TranscriptGroupMode } from "../../types/transcription.types";

export function TranscriptionDisplayOptionsPanel({
  groupMode,
  onGroupModeChange,
  timeLimit,
  onTimeLimitChange,
  charLimit,
  onCharLimitChange,
  showSpeakers,
  onShowSpeakersChange,
}: {
  groupMode: TranscriptGroupMode;
  onGroupModeChange: (mode: TranscriptGroupMode) => void;
  timeLimit: number;
  onTimeLimitChange: (value: number) => void;
  charLimit: number;
  onCharLimitChange: (value: number) => void;
  showSpeakers: boolean;
  onShowSpeakersChange: (value: boolean) => void;
}) {
  return (
    <div className="absolute right-0 z-50 mt-1.5 max-h-[min(70vh,calc(100dvh-11rem))] w-[min(17.5rem,calc(100vw-1.75rem))] space-y-2.5 overflow-y-auto overscroll-contain rounded-md border border-border bg-card p-2.5 text-xs shadow-lg">
      <div className="space-y-1">
        <h4 className="text-xs font-semibold leading-tight">Display</h4>
        <p className="text-[11px] leading-snug text-muted-foreground inline-flex items-start gap-1.5">
          <Users className="mt-px h-3 w-3 shrink-0" />
          Group by paragraph, time, or characters.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <Button
          type="button"
          variant={groupMode === "time" ? "default" : "outline"}
          size="sm"
          className="h-7 gap-0.5 px-1.5 text-[11px]"
          onClick={() => onGroupModeChange("time")}
        >
          <Timer className="h-3 w-3" />
          Time
        </Button>
        <Button
          type="button"
          variant={groupMode === "character" ? "default" : "outline"}
          size="sm"
          className="h-7 gap-0.5 px-1.5 text-[11px]"
          onClick={() => onGroupModeChange("character")}
        >
          <CaseSensitive className="h-3 w-3" />
          Char
        </Button>
        <Button
          type="button"
          variant={groupMode === "paragraph" ? "default" : "outline"}
          size="sm"
          className="h-7 gap-0.5 px-1.5 text-[11px]"
          onClick={() => onGroupModeChange("paragraph")}
        >
          <Pilcrow className="h-3 w-3" />
          Para
        </Button>
      </div>

      <div className={cn("space-y-1", groupMode !== "time" && "pointer-events-none opacity-40 grayscale")}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="time-limit" className="text-[11px] font-normal leading-none">
            New line every
          </Label>
          <span className="text-[11px] text-muted-foreground tabular-nums">{timeLimit}s</span>
        </div>
        <Slider
          id="time-limit"
          className="py-0.5"
          min={0}
          max={180}
          step={1}
          value={[timeLimit]}
          onValueChange={([value]) => onTimeLimitChange(Math.round(value ?? 0))}
          disabled={groupMode !== "time"}
        />
      </div>

      <div className={cn("space-y-1", groupMode !== "character" && "pointer-events-none opacity-40 grayscale")}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="char-limit" className="text-[11px] font-normal leading-none">
            Char limit
          </Label>
          <span className="text-[11px] text-muted-foreground tabular-nums">{charLimit}</span>
        </div>
        <Slider
          id="char-limit"
          className="py-0.5"
          min={50}
          max={500}
          step={10}
          value={[charLimit]}
          onValueChange={([value]) => onCharLimitChange(Math.round(value ?? 50))}
          disabled={groupMode !== "character"}
        />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <Label htmlFor="show-speakers" className="text-[11px] font-normal leading-none">
          Show speakers
        </Label>
        <Switch
          id="show-speakers"
          className="scale-90"
          checked={showSpeakers}
          onCheckedChange={(v) => onShowSpeakersChange(Boolean(v))}
        />
      </div>
    </div>
  );
}
