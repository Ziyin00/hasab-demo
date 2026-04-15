"use client";

import { useTTS } from "../hooks/useTTS";
import { FormProvider } from "@/components/forms/FormProvider";
import { InputField } from "@/components/forms/InputField";
import { ttsRequestSchema } from "../schemas/tts-request.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";

const TTSFormContent = () => {
  const { register } = useFormContext();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Text to convert</label>
        <Textarea 
          {...register("text")} 
          placeholder="Type something amazing..." 
          className="min-h-[200px]"
        />
      </div>
      <InputField name="voice" label="Voice Model" placeholder="e.g. Adam, Bella" />
      <Button type="submit" className="w-full py-6 text-lg font-semibold">
        Synthesize Speech
      </Button>
    </div>
  );
};

export const TTSUploader = () => {
  const { config, generateSpeech } = useTTS();

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <h2 className="text-3xl font-semibold tracking-tight">{config.ui.title}</h2>
        <CardDescription>{config.ui.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <FormProvider 
          schema={ttsRequestSchema} 
          onSubmit={generateSpeech}
          defaultValues={{ speed: 1.0 }}
        >
          <TTSFormContent />
        </FormProvider>
      </CardContent>
    </Card>
  );
};
