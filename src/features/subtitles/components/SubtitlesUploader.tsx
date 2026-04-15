"use client";

import { useSubtitles } from "../hooks/useSubtitles";
import { FormProvider } from "@/components/forms/FormProvider";
import { FileUploader } from "@/components/forms/FileUploader";
import { subtitlesRequestSchema } from "../schemas/subtitles-request.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";

export const SubtitlesUploader = () => {
  const { config, generateSubtitles } = useSubtitles();

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <h2 className="text-3xl font-semibold tracking-tight">{config.ui.title}</h2>
        <CardDescription>{config.ui.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <FormProvider schema={subtitlesRequestSchema} onSubmit={(data) => generateSubtitles(data.file)}>
          <div className="space-y-6">
            <FileUploader name="file" label={config.ui.uploadLabel} accept={config.input.accept} />
            <Button type="submit" className="w-full py-6 text-lg font-semibold">
              Generate Subtitles
            </Button>
          </div>
        </FormProvider>
      </CardContent>
    </Card>
  );
};
