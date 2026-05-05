"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, X, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  const { mutate: create, isPending: creating } = useCreateContext(apiKey);
  const { mutate: update, isPending: updating } = useUpdateContext(apiKey);
  const isPending = creating || updating;
  const isEditing = !!editingContext;

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
        { onSuccess: () => { setForm(DEFAULT_FORM); onCancelEdit(); } }
      );
    } else {
      create(payload, { onSuccess: () => setForm(DEFAULT_FORM) });
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    onCancelEdit();
  };

  const isValid = !!form.name.trim() && !!form.context_data.trim();
  const charCount = form.context_data.length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
        isEditing ? "bg-amber-500/5" : "bg-muted/20"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0 ${
            isEditing ? "bg-amber-500/15" : "bg-primary/10"
          }`}>
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
        {isEditing && (
          <button
            type="button"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

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
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Priority
            </Label>
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
            <span className={`text-xs font-mono ${charCount > 4000 ? "text-destructive" : "text-muted-foreground"}`}>
              {charCount.toLocaleString()} chars
            </span>
          </div>
          <Textarea
            id="ctx-data"
            value={form.context_data}
            onChange={(e) => setForm((p) => ({ ...p, context_data: e.target.value }))}
            placeholder="Add company details, services, policies, custom vocabulary..."
            className="resize-none text-sm h-60 overflow-y-auto"
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
    </div>
  );
}
