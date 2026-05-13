"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContextItem } from "../types/context.types";

function renderLine(line: string, index: number) {
  // bullet: "* text" or "- text"
  if (/^[*-] /.test(line)) {
    return (
      <div key={index} className="flex gap-2">
        <span className="text-muted-foreground flex-shrink-0 select-none">•</span>
        <span>{renderInline(line.slice(2))}</span>
      </div>
    );
  }
  // empty line → spacer
  if (line.trim() === "") {
    return <div key={index} className="h-2" />;
  }
  return <div key={index}>{renderInline(line)}</div>;
}

function renderInline(text: string): React.ReactNode {
  // bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

interface Props {
  context: ContextItem | null;
  onClose: () => void;
}

export function ContextPreviewDialog({ context, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!context) return;
    await navigator.clipboard.writeText(context.context_data);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={!!context} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Context Preview</DialogTitle>
        </DialogHeader>
        {context && (
          <div className="flex flex-col min-h-0 flex-1 gap-3 overflow-hidden">
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="font-medium text-sm truncate pr-4">{context.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  Priority: {context.priority}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    context.is_active
                      ? "border-green-500/30 text-green-500 bg-green-500/10"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {context.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex-shrink-0">
              {context.context_data.length.toLocaleString()} characters
            </p>

            <div className="flex-1 min-h-0 overflow-y-auto rounded-md border bg-muted/30">
              <div className="p-3 text-sm leading-relaxed text-foreground space-y-0.5">
                {context.context_data.split("\n").map((line, i) => renderLine(line, i))}
              </div>
            </div>

            <div className="flex justify-end flex-shrink-0 pt-1">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
