"use client";

import { useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { contextApi } from "../api/context.api";
import { LANGUAGE_OPTIONS } from "../types/context.types";

interface Props {
  apiKey: string;
}

export function SttTestTab({ apiKey }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [result, setResult] = useState("");

  const langOption = LANGUAGE_OPTIONS.find((o) => o.value === language);

  const { mutate: transcribe, isPending, error, reset } = useMutation({
    mutationFn: () =>
      contextApi.transcribe(apiKey, file!, langOption?.apiValue ?? "en"),
    onSuccess: (text) => setResult(text),
  });

  const handleSubmit = () => {
    if (!file) return;
    setResult("");
    reset();
    transcribe();
  };

  const apiError = error
    ? ((error as AxiosError<{ message: string }>).response?.data?.message ??
        (error as Error).message)
    : null;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Speech-to-Text Test</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Test transcription with your active contexts applied.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Audio File</Label>
        <Input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!file || isPending || !apiKey}
        className="gap-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {isPending ? "Transcribing..." : "Transcribe"}
      </Button>

      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-1.5">
          <Label className="text-sm">Transcription</Label>
          <Textarea
            rows={6}
            value={result}
            readOnly
            className="resize-none bg-muted/30"
          />
        </div>
      )}
    </div>
  );
}
