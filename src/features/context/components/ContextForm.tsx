"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Pencil, X, RotateCcw, Upload, Info, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useCreateContext, useUpdateContext } from "../hooks/useContexts";
import type { ContextItem, ContextFormData } from "../types/context.types";

function renderLine(line: string, index: number) {
  if (/^[*-] /.test(line)) {
    return (
      <div key={index} className="flex gap-2">
        <span className="text-muted-foreground flex-shrink-0 select-none">•</span>
        <span>{renderInline(line.slice(2))}</span>
      </div>
    );
  }
  if (line.trim() === "") return <div key={index} className="h-2" />;
  return <div key={index}>{renderInline(line)}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

const DEFAULT_FORM: ContextFormData = {
  name: "",
  priority: 80,
  is_active: true,
  context_data: "",
};

const PRIORITY_PRESETS = [
  { label: "Low", value: 25 },
  { label: "Normal", value: 80 },
  { label: "High", value: 150 },
  { label: "Max", value: 200 },
] as const;

interface Props {
  apiKey: string;
  editingContext: ContextItem | null;
  onCancelEdit: () => void;
}

export function ContextForm({ apiKey, editingContext, onCancelEdit }: Props) {
  const [form, setForm] = useState<ContextFormData>(DEFAULT_FORM);
  const [loadingFile, setLoadingFile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: create, isPending: creating } = useCreateContext(apiKey);
  const { mutate: update, isPending: updating } = useUpdateContext(apiKey);
  const isPending = creating || updating;
  const isEditing = !!editingContext;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingFile(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setForm((p) => ({ ...p, context_data: content }));
      if (!form.name) {
        setForm((p) => ({ ...p, name: file.name.replace(/\.[^.]+$/, "") }));
      }
      setLoadingFile(false);
      toast.success(`Loaded ${file.name}`);
    };
    reader.onerror = () => {
      setLoadingFile(false);
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (editingContext) {
      setForm({
        name: editingContext.name,
        priority: editingContext.priority,
        is_active: editingContext.is_active,
        context_data: editingContext.context_data,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editingContext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.context_data.trim()) return;

    const payload: ContextFormData = {
      ...form,
      name: form.name.trim(),
      context_data: form.context_data.trim(),
      priority: Number(form.priority),
    };

    if (editingContext) {
      update(
        { id: editingContext.id, data: payload },
        {
          onSuccess: () => {
            setForm(DEFAULT_FORM);
            onCancelEdit();
            setExpanded(false);
          },
        }
      );
    } else {
      create(payload, {
        onSuccess: () => {
          setForm(DEFAULT_FORM);
          setExpanded(false);
        },
      });
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    onCancelEdit();
    setExpanded(false);
  };

  const isValid = !!form.name.trim() && !!form.context_data.trim();
  const charCount = form.context_data.length;

  const cardHeader = (inDialog = false) => (
    <div
      className={`px-5 py-3.5 border-b flex items-center justify-between ${
        isEditing ? "bg-amber-500/5" : "bg-muted/20"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0 ${
            isEditing ? "bg-amber-500/15" : "bg-primary/10"
          }`}
        >
          {isEditing
            ? <Pencil className="h-3.5 w-3.5 text-amber-500" />
            : <Plus className="h-3.5 w-3.5 text-primary" />
          }
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">
            {isEditing ? "Edit Context" : "New Context"}
          </p>
          {isEditing && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate max-w-[160px]">
              {editingContext.name}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isEditing && !inDialog && (
          <button
            type="button"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded(!inDialog)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          title={inDialog ? "Collapse" : "Expand"}
        >
          {inDialog
            ? <Minimize2 className="h-4 w-4" />
            : <Maximize2 className="h-4 w-4" />
          }
        </button>
        {inDialog && isEditing && (
          <button
            type="button"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  const formBody = (
    <form className="p-5 space-y-4" onSubmit={handleSubmit}>
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="ctx-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Name
        </Label>
        <Input
          id="ctx-name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Company Information"
          disabled={!apiKey}
        />
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Priority
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-default" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  Higher values are injected first into the AI context. Use this to control which contexts take precedence (0–200).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="number"
            min={0}
            max={200}
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))}
            disabled={!apiKey}
            className="h-6 w-14 text-xs text-center px-1 font-mono"
          />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {PRIORITY_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              disabled={!apiKey}
              onClick={() => setForm((p) => ({ ...p, priority: preset.value }))}
              className={`py-1.5 text-xs rounded-md border transition-all ${
                form.priority === preset.value
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3.5 py-2.5">
        <div>
          <p className="text-xs font-semibold">Active</p>
          <p className="text-xs text-muted-foreground">
            {form.is_active ? "Injected into chat requests" : "Paused — not used"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.is_active}
          disabled={!apiKey}
          onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none disabled:opacity-50 ${
            form.is_active ? "bg-primary" : "bg-input"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
              form.is_active ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Context Data */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="ctx-data" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Context Data
          </Label>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono ${charCount > 4000 ? "text-destructive" : "text-muted-foreground"}`}>
              {charCount.toLocaleString()} chars
            </span>
            <button
              type="button"
              disabled={!apiKey || loadingFile}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              title="Upload a .txt or .md file"
            >
              {loadingFile
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Upload className="h-3 w-3" />
              }
              Upload file
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.csv,.json"
          className="hidden"
          onChange={handleFileChange}
        />
        <Textarea
          id="ctx-data"
          value={form.context_data}
          onChange={(e) => setForm((p) => ({ ...p, context_data: e.target.value }))}
          placeholder="Add company details, services, policies, custom vocabulary... or upload a .txt / .md file above."
          className={`resize-none text-sm overflow-y-auto ${expanded ? "h-[28rem]" : "h-60"}`}
          disabled={!apiKey}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="submit"
          className="flex-1"
          size="sm"
          disabled={isPending || !isValid || !apiKey}
        >
          {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {isEditing ? "Update Context" : "Create Context"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isPending}
          title={isEditing ? "Cancel edit" : "Reset form"}
        >
          {isEditing ? <X className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {/* Inline card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {cardHeader(false)}
        {expanded ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Maximize2 className="h-5 w-5 opacity-30" />
            <p className="text-xs">Editing in expanded view</p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs text-primary hover:underline mt-1"
            >
              Collapse
            </button>
          </div>
        ) : (
          formBody
        )}
      </div>

      {/* Expanded dialog */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh]"
          showCloseButton={false}
        >
          <VisuallyHidden.Root>
            <DialogTitle>{isEditing ? "Edit Context" : "New Context"}</DialogTitle>
          </VisuallyHidden.Root>
          <div className="flex-shrink-0">{cardHeader(true)}</div>
          <div className="overflow-y-auto flex-1">{formBody}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
