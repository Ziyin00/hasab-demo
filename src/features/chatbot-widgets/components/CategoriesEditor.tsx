"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Tag, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from "../hooks/useCategories";
import { MAX_CATEGORIES_PER_WIDGET, type ChatCategory } from "../types/category.types";

interface Draft {
  name: string;
  description: string;
  is_active: boolean;
}

function emptyDraft(): Draft {
  return { name: "", description: "", is_active: true };
}

interface CategoriesEditorProps {
  widgetId: number;
}

export function CategoriesEditor({ widgetId }: CategoriesEditorProps) {
  const { data: categories, isLoading } = useCategories(widgetId);
  const { mutate: create, isPending: creating } = useCreateCategory(widgetId);
  const { mutate: update, isPending: updating } = useUpdateCategory(widgetId);
  const { mutate: remove, isPending: deleting } = useDeleteCategory(widgetId);
  const { mutate: reorder } = useReorderCategories(widgetId);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft());
  const [confirmDelete, setConfirmDelete] = useState<ChatCategory | null>(null);

  const sorted = [...(categories ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const atCap = sorted.length >= MAX_CATEGORIES_PER_WIDGET;

  const openAdd = () => {
    setDraft(emptyDraft());
    setAdding(true);
  };

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    create(
      {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        is_active: draft.is_active,
      },
      { onSuccess: () => setAdding(false) }
    );
  };

  const startEdit = (c: ChatCategory) => {
    setEditingId(c.id);
    setEditDraft({ name: c.name, description: c.description ?? "", is_active: c.is_active });
  };

  const saveEdit = (id: number) => {
    if (!editDraft.name.trim()) return;
    update(
      {
        id,
        payload: {
          name: editDraft.name.trim(),
          description: editDraft.description.trim() || null,
          is_active: editDraft.is_active,
        },
      },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const toggleActive = (c: ChatCategory, is_active: boolean) => {
    update({ id: c.id, payload: { is_active } });
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    reorder(next.map((c) => c.id));
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    remove(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Question Categories
          </Label>
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-md">
            New conversations are auto-classified into one of these, or left Uncategorized.
            The description is shown to the classifier — keep it short with example phrases.
          </p>
        </div>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={openAdd} disabled={atCap}>
          <Plus className="h-3.5 w-3.5" />
          New Category
        </Button>
      </div>

      {atCap && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Limit reached — {MAX_CATEGORIES_PER_WIDGET} categories per widget.
        </p>
      )}

      {sorted.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/10 py-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">No categories yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Every conversation will show as Uncategorized until you add some.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((c, i) =>
            editingId === c.id ? (
              <div key={c.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <Input
                  value={editDraft.name}
                  onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Category name"
                  className="text-sm"
                />
                <Textarea
                  value={editDraft.description}
                  onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Shown to the classifier, e.g. Plans, billing, quotes, discounts"
                  className="text-sm resize-none"
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={editDraft.is_active}
                      onCheckedChange={(v) => setEditDraft((d) => ({ ...d, is_active: v }))}
                    />
                    Active
                  </label>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      disabled={updating || !editDraft.name.trim()}
                      onClick={() => saveEdit(c.id)}
                    >
                      {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5"
              >
                <div className="flex flex-col shrink-0 pt-0.5">
                  <button
                    className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === sorted.length - 1}
                    onClick={() => move(i, 1)}
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <code className="text-[10px] text-muted-foreground font-mono">{c.slug}</code>
                    {!c.is_active && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase bg-muted text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={(v) => toggleActive(c, v)}
                    title="Active"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => startEdit(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDelete(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <Input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Category name, e.g. Pricing"
            className="text-sm"
            autoFocus
          />
          <Textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Shown to the classifier, e.g. Plans, billing, quotes, discounts"
            className="text-sm resize-none"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={draft.is_active}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))}
              />
              Active
            </label>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1 text-xs"
                disabled={creating || !draft.name.trim()}
                onClick={handleCreate}
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{confirmDelete?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              Conversations already classified into this category keep their label (shown as
              &ldquo;Deleted category&rdquo;), but it won&apos;t be offered to the classifier or
              in filters going forward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
