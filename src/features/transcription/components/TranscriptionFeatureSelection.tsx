"use client";

import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TRANSCRIPTION_OPTIONAL_FEATURES, TRANSCRIPTION_TARGET_LANGUAGES } from "../config/transcriptionFeatures.config";

export type TranscriptionFeatureFormFields = {
  summarize: boolean;
  translate: boolean;
  targetLanguage?: string;
};

const toggleRail = cn(
  "flex cursor-pointer items-center gap-3 rounded-md border border-input bg-transparent px-3 shadow-xs outline-none transition-[color,box-shadow,background-color,border-color]",
  "min-h-9 hover:bg-accent/35 dark:bg-input/20 dark:hover:bg-input/35",
  "has-[[data-slot=checkbox]:focus-visible]:border-ring has-[[data-slot=checkbox]:focus-visible]:ring-3 has-[[data-slot=checkbox]:focus-visible]:ring-ring/45"
);

/** Two sibling grid cells: Label + control rhythm like `<InputField />`. Same form flow — only presentation. */
export function TranscriptionFeatureSelection() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const summarize = Boolean(watch("summarize"));
  const translate = Boolean(watch("translate"));
  const targetLanguage = (watch("targetLanguage") as string | undefined) ?? "";

  const targetLangError =
    typeof errors.targetLanguage?.message === "string" ? errors.targetLanguage.message : undefined;

  const summarizeMeta = TRANSCRIPTION_OPTIONAL_FEATURES[0];
  const summarizeId = summarizeMeta ? `feature-${summarizeMeta.id}` : "feature-summary";

  const onTranslateToggle = (checked: boolean) => {
    setValue("translate", checked, { shouldDirty: true, shouldValidate: true });
    if (!checked) {
      setValue("targetLanguage", "", { shouldDirty: true, shouldValidate: true });
    }
  };

  const onTranslateLanguage = (value: string) => {
    setValue("targetLanguage", value || "", { shouldDirty: true, shouldValidate: true });
  };

  const summarizeBlurbs = summarizeMeta?.description;

  return (
    <Fragment>
      <div className="flex w-full flex-col gap-2 ">
        {/* <div className="space-y-0.5">
          <Label htmlFor={summarizeId} className="text-sm leading-none font-medium">
            {summarizeMeta?.title ?? "Summarization"}
            <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
          </Label>

        </div> */}
        <label
          htmlFor={summarizeId}
          className={cn(toggleRail, "py-3")}
        >
          <Checkbox
            id={summarizeId}
            checked={summarize}
            onCheckedChange={(v) =>
              setValue("summarize", v === true, { shouldDirty: true, shouldValidate: true })
            }
            className="shrink-0"
          />
          <span className="min-w-0 flex-1 text-left text-sm text-foreground leading-snug">
            Include summary
          </span>
        </label>
      </div>

      <div className="flex w-full flex-col gap-2">
        {/* <Label htmlFor="translate-checkbox" className="text-sm leading-none font-medium">
          Translate
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        </Label> */}
        <label
          htmlFor="translate-checkbox"
          className={cn(toggleRail, "h-11 py-0 flex items-center gap-2")}
        >
          <Checkbox
            id="translate-checkbox"
            checked={translate}
            onCheckedChange={(v) => onTranslateToggle(v === true)}
            className="shrink-0"
          />

          <span className="min-w-0 flex-1 text-left text-sm text-foreground font-medium leading-none">
            Generate translation
          </span>

          {translate ? (

            <div className="">



              <Select value={targetLanguage || ""} onValueChange={onTranslateLanguage}>

                <SelectTrigger

                  id="translate-language"

                  aria-invalid={Boolean(targetLangError)}

                  className="w-full cursor-pointer"

                >

                  <SelectValue placeholder="Select language" />

                </SelectTrigger>

                <SelectContent align="start" className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) mt-8">

                  {TRANSCRIPTION_TARGET_LANGUAGES.map((lang) => (

                    <SelectItem key={lang.value} value={lang.value}>

                      {lang.label}

                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

              {targetLangError ? <p className="text-sm text-destructive">{targetLangError}</p> : null}

            </div>

          ) : null}
        </label>

      </div>
    </Fragment>
  );
}
