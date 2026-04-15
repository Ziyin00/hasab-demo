"use client";

import { useTranslation } from "../hooks/useTranslation";
import { FormProvider } from "@/components/forms/FormProvider";
import { FileUploader } from "@/components/forms/FileUploader";
import { InputField } from "@/components/forms/InputField";
import { TranslationRequest } from "../types/translation.types";
import { translationRequestSchema } from "../schemas/translation-request.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";

const TranslationFormContent = () => {
  const { register, watch } = useFormContext();
  const activeTab = watch("type") || "file";

  return (
    <div className="space-y-6">
      <Tabs defaultValue="file" onValueChange={(v) => console.log(v)}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="file">File Upload</TabsTrigger>
          <TabsTrigger value="text">Direct Text</TabsTrigger>
        </TabsList>
        <TabsContent value="file">
          <FileUploader name="file" label="Upload Audio/Video" />
        </TabsContent>
        <TabsContent value="text">
          <Textarea 
            {...register("text")} 
            placeholder="Paste text to translate..." 
            className="min-h-[150px]"
          />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField name="sourceLanguage" label="Source Language" placeholder="Detecting..." />
        <InputField name="targetLanguage" label="Target Language" placeholder="e.g. Arabic" />
      </div>

      <Button type="submit" className="w-full py-6 text-lg font-semibold">
        Translate Now
      </Button>
    </div>
  );
};

export const TranslationUploader = () => {
  const { config, translate } = useTranslation();

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <h2 className="text-3xl font-semibold tracking-tight">{config.ui.title}</h2>
        <CardDescription>{config.ui.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <FormProvider schema={translationRequestSchema} onSubmit={translate}>
          <TranslationFormContent />
        </FormProvider>
      </CardContent>
    </Card>
  );
};
