"use client";

import { useState } from "react";
import { Code2, Pencil, Trash2, Loader2, Globe, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ChatbotWidget } from "../types/chatbot-widget.types";
import { useDeleteChatbotWidget } from "../hooks/useChatbotWidgets";

interface WidgetCardProps {
  widget: ChatbotWidget;
  onEdit: (widget: ChatbotWidget) => void;
  onSnippet: (widget: ChatbotWidget) => void;
}

export function WidgetCard({ widget, onEdit, onSnippet }: WidgetCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: deleteWidget, isPending: deleting } = useDeleteChatbotWidget();

  const handleDelete = () => {
    deleteWidget(widget.id, { onSuccess: () => setConfirmDelete(false) });
  };

  return (
    <>
      <div className="rounded-xl border bg-card p-5 space-y-4 hover:border-primary/30 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold truncate">{widget.name}</h3>
              {widget.is_active ? (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-green-500/10 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-muted text-muted-foreground">
                  <XCircle className="h-2.5 w-2.5" />
                  Inactive
                </span>
              )}
            </div>
            <code className="text-[11px] text-muted-foreground font-mono">{widget.widget_id}</code>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="View snippet"
              onClick={() => onSnippet(widget)}
            >
              <Code2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Edit widget"
              onClick={() => onEdit(widget)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              title="Delete widget"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3 shrink-0" />
            {widget.allowed_origins.length === 0 ? (
              <span className="text-amber-600 dark:text-amber-400">No origins configured</span>
            ) : (
              <span>
                {widget.allowed_origins.slice(0, 2).join(", ")}
                {widget.allowed_origins.length > 2 && ` +${widget.allowed_origins.length - 2} more`}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded bg-muted/50 px-1.5 py-0.5">
              {widget.position}
            </span>
            <span className="rounded bg-muted/50 px-1.5 py-0.5">
              {widget.default_language}
            </span>
            <span className="rounded bg-muted/50 px-1.5 py-0.5">
              {widget.rate_limit_per_minute} req/min
            </span>
          </div>
        </div>

        {/* Snippet button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => onSnippet(widget)}
        >
          <Code2 className="h-3.5 w-3.5" />
          View Embed Snippet
        </Button>
      </div>

      {/* Delete confirm */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{widget.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              This permanently removes the widget and its configuration. Any pages embedding{" "}
              <code className="font-mono text-xs">{widget.widget_id}</code> will stop loading the widget.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
