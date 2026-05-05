"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
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
import { MODEL_OPTIONS } from "../types/context.types";

interface Props {
  apiKey: string;
}

export function ChatTestTab({ apiKey }: Props) {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0].value);
  const [response, setResponse] = useState("");

  const { mutate: send, isPending, error, reset } = useMutation({
    mutationFn: () => contextApi.chat(apiKey, message.trim(), model),
    onSuccess: (text) => setResponse(text),
  });

  const handleSend = () => {
    if (!message.trim()) return;
    setResponse("");
    reset();
    send();
  };

  const apiError = error
    ? ((error as AxiosError<{ message: string }>).response?.data?.message ??
        (error as Error).message)
    : null;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Chat API Test</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Test your active contexts by sending a message to the chat API.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Message</Label>
        <Textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question to test your active contexts..."
          className="resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="space-y-1.5 flex-1">
          <Label className="text-sm">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleSend}
          disabled={isPending || !message.trim() || !apiKey}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending ? "Sending..." : "Send"}
        </Button>
      </div>

      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {response && (
        <div className="space-y-1.5">
          <Label className="text-sm">Response</Label>
          <Textarea
            rows={6}
            value={response}
            readOnly
            className="resize-none bg-muted/30"
          />
        </div>
      )}
    </div>
  );
}
