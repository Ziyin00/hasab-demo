"use client";

import { useState } from "react";
import { Plus, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AllowedOriginsEditorProps {
  origins: string[];
  onChange: (origins: string[]) => void;
}

export function AllowedOriginsEditor({ origins, onChange }: AllowedOriginsEditorProps) {
  const [input, setInput] = useState("");
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("Origin must start with http:// or https://");
      return;
    }
    try {
      const url = new URL(trimmed);
      const origin = url.origin;
      if (origins.includes(origin)) {
        toast.error("Origin already added");
        return;
      }
      onChange([...origins, origin]);
      setInput("");
    } catch {
      toast.error("Invalid origin URL");
    }
  };

  const confirmRemove = () => {
    if (!pendingRemove) return;
    onChange(origins.filter((o) => o !== pendingRemove));
    setPendingRemove(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Allowed Origins
        </Label>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Full origins where the widget is permitted to load, e.g.{" "}
          <code className="font-mono bg-muted px-0.5 rounded">https://example.com</code>. The
          protocol and hostname must match exactly.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          className="text-sm"
        />
        <Button type="button" size="sm" onClick={add} className="shrink-0 gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {origins.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          No origins added yet. Add at least one origin so the widget can load.
        </div>
      ) : (
        <div className="space-y-1.5">
          {origins.map((origin) => (
            <div
              key={origin}
              className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2"
            >
              <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <code className="flex-1 truncate font-mono text-xs">{origin}</code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => setPendingRemove(origin)}
                aria-label={`Remove ${origin}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={pendingRemove != null} onOpenChange={(open) => !open && setPendingRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this origin?</DialogTitle>
            <DialogDescription>
              The widget will no longer load on{" "}
              <code className="rounded bg-muted px-1 font-mono text-foreground">
                {pendingRemove}
              </code>
              . Pages using this origin will stop working until you add it again and save.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmRemove}>
              Remove origin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
