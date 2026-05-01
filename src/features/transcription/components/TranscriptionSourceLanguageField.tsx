"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  coerceApiLanguageCode,
  TRANSCRIPTION_SOURCE_LANGUAGE_OPTIONS,
  type TranscriptionApiLanguageCode,
} from "../config/transcriptionApiLanguages";

/** Radix Select needs a sentinel — API omits language when unset (auto-detect). */
const AUTO_VALUE = "__auto__" as const;

export function TranscriptionSourceLanguageField() {
  const { watch, setValue } = useFormContext();
  const raw = typeof watch("language") === "string" ? watch("language") : "";
  const normalized = coerceApiLanguageCode(raw);
  const selectValue = (normalized ?? AUTO_VALUE) as TranscriptionApiLanguageCode | typeof AUTO_VALUE;

  return (
    <div className="w-full space-y-2">
      <Label htmlFor="transcription-source-language">Source language (optional)</Label>
      <Select
        value={selectValue}
        onValueChange={(v) => {
          setValue("language", v === AUTO_VALUE ? "" : (v as TranscriptionApiLanguageCode), {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
      >
        <SelectTrigger id="transcription-source-language" className="w-full">
          <SelectValue placeholder="Auto-detect" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={AUTO_VALUE}>Auto-detect</SelectItem>
          {TRANSCRIPTION_SOURCE_LANGUAGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
