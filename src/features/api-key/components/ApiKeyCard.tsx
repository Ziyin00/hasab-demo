"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApiKey, useRegenerateApiKey } from "../hooks/useApiKey";

function MaskedKey({ value }: { value: string }) {
  const prefix = value.slice(0, 10);
  return (
    <span className="font-mono text-sm">
      {prefix}
      {"•".repeat(Math.max(0, value.length - 10))}
    </span>
  );
}

export function ApiKeyCard() {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: apiKey, isLoading, isError } = useApiKey();
  const { mutate: regenerate, isPending } = useRegenerateApiKey();

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmRegenerate = () => {
    regenerate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        setRevealed(false);
        toast.success("API key regenerated. Update any integrations using the old key.");
      },
      onError: () => {
        toast.error("Failed to regenerate API key.");
      },
    });
  };

  return (
    <>
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold">Secret API Key</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Use this key to authenticate requests to the Hasab API.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
          {isLoading ? (
            <Skeleton className="h-4 flex-1" />
          ) : isError || !apiKey ? (
            <span className="text-sm text-muted-foreground italic flex-1">
              Failed to load key
            </span>
          ) : (
            <span className="flex-1 min-w-0 truncate select-all">
              {revealed ? (
                <span className="font-mono text-sm">{apiKey}</span>
              ) : (
                <MaskedKey value={apiKey} />
              )}
            </span>
          )}

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setRevealed((v) => !v)}
              disabled={!apiKey}
              title={revealed ? "Hide key" : "Reveal key"}
            >
              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              disabled={!apiKey}
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Keep your API key secret. Do not share it in public repositories.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
            onClick={() => setConfirmOpen(true)}
            disabled={isLoading || isPending}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerate
          </Button>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <DialogTitle>Regenerate API Key?</DialogTitle>
            </div>
            <DialogDescription>
              Your current key will be immediately invalidated. Any integrations or services
              using it will stop working until updated with the new key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRegenerate}
              disabled={isPending}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Yes, regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
