"use client";

import { useEffect } from "react";
import { useTranscription } from "../hooks/useTranscription";
import { FormProvider } from "@/components/forms/FormProvider";
import { FileUploader } from "@/components/forms/FileUploader";
import { transcriptionRequestSchema } from "../schemas/transcription-request.schema";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import type { TranscriptionRequest } from "../types/transcription.types";
import { TranscriptionFeatureSelection } from "./TranscriptionFeatureSelection";
import { useTranscriptionStore } from "@/store/transcription.store";
import { Loader2, FileAudio } from "lucide-react";

export const TranscriptionUploader = () => {
  const { config, generateTranscription } = useTranscription();
  const router = useRouter();
  const { job, setJob, audioId: storeAudioId } = useTranscriptionStore();

  // Redirect to existing result when there's no active job
  useEffect(() => {
    if (!job && storeAudioId) {
      router.replace(`/dashboard/playground/transcription/${storeAudioId}`);
    }
  }, [job, storeAudioId, router]);

  // Auto-redirect when a running job finishes
  useEffect(() => {
    if (job?.phase !== "done") return;
    if (job.audioId) {
      router.push(`/dashboard/playground/transcription/${job.audioId}`);
    }
    setJob(null);
  }, [job?.phase, job?.audioId, router, setJob]);

  // Render nothing while a redirect is about to happen — prevents the upload form flashing
  if (!job && storeAudioId) return null;

  // In-page processing view — shown while uploading or transcribing
  if (job?.phase === "uploading" || job?.phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[44vh] gap-6 py-14">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 rounded-full bg-primary/10 animate-pulse" />
          <Loader2 className="h-10 w-10 text-primary animate-spin relative z-10" />
        </div>

        <div className="text-center space-y-2 max-w-sm">
          <div className="flex items-center justify-center gap-2">
            <FileAudio className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium truncate max-w-[260px]">{job.fileName}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            {job.phase === "uploading"
              ? `Uploading to server — ${job.progress}%`
              : "Transcribing your audio…"}
          </p>

          {job.phase === "uploading" && (
            <div className="w-56 h-1.5 rounded-full bg-muted overflow-hidden mx-auto mt-1">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}

          {job.phase === "processing" && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              This may take a few minutes.
              <br />
              You can navigate away — it continues in the background.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <div className="px-0">
        <FormProvider
          schema={transcriptionRequestSchema}
          onSubmit={async (data) => {
            const result = await generateTranscription(data as TranscriptionRequest);
            if (result?.mode === "primary" && result.audioId) {
              router.push(`/dashboard/playground/transcription/${result.audioId}`);
              setJob(null);
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
              <TranscriptionFeatureSelection />
            </div>
            <DiarizationField />
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
