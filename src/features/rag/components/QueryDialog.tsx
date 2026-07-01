"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQueryStore } from "../hooks/useRag";
import type { RagQueryResult } from "../types/rag.types";

interface QueryDialogProps {
  storeId: number;
  storeName: string;
}

export function QueryDialog({ storeId, storeName }: QueryDialogProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<RagQueryResult | null>(null);

  const { mutate: query, isPending } = useQueryStore(storeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setResult(null);
    query(
      { question: question.trim() },
      { onSuccess: (data) => setResult(data) }
    );
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setQuestion("");
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Test Q&A
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Test Knowledge Base</DialogTitle>
          <p className="text-sm text-muted-foreground">{storeName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Question</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is your refund policy?"
              rows={3}
              maxLength={2000}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || !question.trim()}
            className="w-full gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Querying..." : "Ask"}
          </Button>
        </form>

        {result && (
          <div className="space-y-4 pt-2 border-t">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Answer
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
            </div>

            {result.sources.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Sources
                </p>
                <div className="space-y-2">
                  {result.sources.map((src, i) => (
                    <div
                      key={i}
                      className="rounded-lg border bg-muted/30 p-3 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          Doc {src.document_id} · Chunk {src.chunk_index}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          Score: {src.relevance_score.toFixed(4)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {src.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
