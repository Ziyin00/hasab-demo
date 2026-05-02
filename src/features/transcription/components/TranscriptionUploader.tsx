"use client";

import { useTranscription } from "../hooks/useTranscription";
import { FormProvider } from "@/components/forms/FormProvider";
import { FileUploader } from "@/components/forms/FileUploader";
import { InputField } from "@/components/forms/InputField";
import { transcriptionRequestSchema } from "../schemas/transcription-request.schema";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import type { TranscriptionRequest } from "../types/transcription.types";
import { TranscriptionFeatureSelection } from "./TranscriptionFeatureSelection";
import { TranscriptionSourceLanguageField } from "./TranscriptionSourceLanguageField";

export const TranscriptionUploader = () => {
  const { config, generateTranscription } = useTranscription();
  const router = useRouter();

  return (
    <div className="bg-transparent">
      <div className="px-0">
        <FormProvider
          schema={transcriptionRequestSchema}
          onSubmit={async (data) => {
            const result = await generateTranscription(data as TranscriptionRequest);
            if (result?.mode === "primary" && result.audioId) {
              router.push(`/dashboard/playground/transcription/${result.audioId}`);
            }
          }}
          defaultValues={{
            burnIn: false,
            diarization: true,
            language: "",
            summarize: false,
            translate: false,
            targetLanguage: "",
          }}
        >
          <div className="space-y-8 sm:space-y-10">
            <FileUploader name="file" label={config.ui.uploadLabel} accept={config.input.accept} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* <TranscriptionSourceLanguageField />
              <InputField
                name="style"
                label="Subtitle Style (Optional)"
                placeholder="e.g. default, social, cinematic"
              /> */}
              <TranscriptionFeatureSelection />
            </div>
            <DiarizationField />
            {/* <BurnInField /> */}
            <Button type="submit" className="w-full py-5 text-base font-semibold sm:py-6 sm:text-lg">
              Generate Transcription
            </Button>
          </div>
        </FormProvider>
      </div>
    </div>
  );
};

function DiarizationField() {
  const { watch, setValue } = useFormContext();
  const diarization = Boolean(watch("diarization"));

  return (
    <div className="flex flex-col gap-4 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3">
      <div className="min-w-0 space-y-1">
        <Label htmlFor="diarization">Speaker separation (Diarization)</Label>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-xs">
          Enable this to separate speakers in the transcript.
        </p>
      </div>
      <Switch
        id="diarization"
        className="shrink-0"
        checked={diarization}
        onCheckedChange={(checked) => setValue("diarization", Boolean(checked))}
      />
    </div>
  );
}

// function BurnInField() {
//   const { register } = useFormContext();

//   return (
//     <div className="flex items-center justify-between rounded-lg p-3">
//       <div className="space-y-1">
//         <Label htmlFor="burnIn">Burn subtitles into video</Label>
//         <p className="text-xs text-muted-foreground">
//           Keep off if you only want text/SRT/VTT outputs.
//         </p>
//       </div>
//       <input
//         id="burnIn"
//         type="checkbox"
//         className="h-4 w-4 accent-primary"
//         {...register("burnIn")}
//       />
//     </div>
//   );
// }
