"use client";

import { useTranscription } from "../hooks/useTranscription";
import { FormProvider } from "@/components/forms/FormProvider";
import { FileUploader } from "@/components/forms/FileUploader";
import { InputField } from "@/components/forms/InputField";
import { transcriptionRequestSchema } from "../schemas/transcription-request.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const TranscriptionUploader = () => {
  const { config, uploadAudio } = useTranscription();

  const handleUpload = async (data: any) => {
    await uploadAudio(data.file);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <TypographyH2>{config.ui.title}</TypographyH2>
        <CardDescription>{config.ui.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <FormProvider 
          schema={transcriptionRequestSchema} 
          onSubmit={handleUpload}
          defaultValues={{ diarization: false }}
        >
          <div className="space-y-6">
            <FileUploader 
              name="file" 
              label={config.ui.uploadLabel} 
              accept={config.input.accept}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField 
                name="language" 
                label="Source Language (Optional)" 
                placeholder="e.g. English" 
              />
            </div>

            <Button type="submit" className="w-full py-6 text-lg font-semibold">
              Start Transcription
            </Button>
          </div>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

function TypographyH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  );
}
