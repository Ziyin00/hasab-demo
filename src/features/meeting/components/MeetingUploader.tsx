"use client";

import { useMeetingMinutes } from "../hooks/useMeetingMinutes";
import { FormProvider } from "@/components/forms/FormProvider";
import { FileUploader } from "@/components/forms/FileUploader";
import { meetingRequestSchema } from "../schemas/meeting-request.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";

export const MeetingUploader = () => {
  const { config, submitMeetingMinutesUpload } = useMeetingMinutes();

  const handleUpload = async (data: { file: File }) => {
    await submitMeetingMinutesUpload({ file: data.file, language: "amh" });
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <h2 className="text-3xl font-semibold tracking-tight">{config.ui.title}</h2>
        <CardDescription>{config.ui.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <FormProvider schema={meetingRequestSchema} onSubmit={handleUpload}>
          <div className="space-y-6">
            <FileUploader 
              name="file" 
              label={config.ui.uploadLabel} 
              accept={config.input.accept}
            />
            <Button type="submit" className="w-full py-6 text-lg font-semibold">
              Generate Meeting Minutes
            </Button>
          </div>
        </FormProvider>
      </CardContent>
    </Card>
  );
};
