"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Tag,
  Loader2,
  X,
  Check,
  Sparkles,
  Info,
} from "lucide-react";
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
  useCreateStarterCategories,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from "../hooks/useCategories";
import {
  CATEGORY_DESCRIPTION_PLACEHOLDER,
  MAX_CATEGORIES_PER_WIDGET,
  STARTER_CATEGORIES,
  type ChatCategory,
} from "../types/category.types";
import { cn } from "@/lib/utils";

interface Draft {
  name: string;
  description: string;
  is_active: boolean;
}

function emptyDraft(): Draft {
  return { name: "", description: "", is_active: true };
}

function CategoryFormFields({
  draft,
  onChange,
  autoFocus,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  autoFocus?: boolean;
}) {
  const descriptionEmpty = !draft.description.trim();

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Name</Label>
        <Input
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value.slice(0, 120) })}
          placeholder="e.g. Pricing"
          className="text-sm"
          maxLength={120}
          autoFocus={autoFocus}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          placeholder={CATEGORY_DESCRIPTION_PLACEHOLDER}
          className={cn("text-sm resize-none", descriptionEmpty && draft.name && "border-amber-400/70")}
          rows={3}
        />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Sent to the classifier and used for keyword fallback. Include 3+ example phrases
          visitors might type.
        </p>
        {descriptionEmpty && draft.name.trim() && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            Description is required for reliable auto-classification.
          </p>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch
          checked={draft.is_active}
          onCheckedChange={(v) => onChange({ ...draft, is_active: v })}
        />
        Active — only active categories are used by the classifier
      </label>
    </div>
  );
}

interface CategoriesEditorProps {
  widgetId: number;
}

export function CategoriesEditor({ widgetId }: CategoriesEditorProps) {
  const { data: categories, isLoading } = useCategories(widgetId);
  const { mutate: create, isPending: creating } = useCreateCategory(widgetId);
  const { mutate: createStarters, isPending: seeding } = useCreateStarterCategories(widgetId);
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
  const canAddStarters =
    sorted.length === 0 && STARTER_CATEGORIES.length <= MAX_CATEGORIES_PER_WIDGET;

  const openAdd = () => {
    setDraft(emptyDraft());
    setAdding(true);
  };

  const canSubmitDraft = (d: Draft) => Boolean(d.name.trim() && d.description.trim());

  const handleCreate = () => {
    if (!canSubmitDraft(draft)) return;
    create(
      {
        name: draft.name.trim(),
        description: draft.description.trim(),
        is_active: draft.is_active,
      },
      { onSuccess: () => setAdding(false) }
    );
  };

  const handleAddStarters = () => {
    createStarters(
      STARTER_CATEGORIES.map((c, i) => ({
        ...c,
        sort_order: i,
      }))
    );
  };

  const startEdit = (c: ChatCategory) => {
    setEditingId(c.id);
    setEditDraft({ name: c.name, description: c.description ?? "", is_active: c.is_active });
  };

  const saveEdit = (id: number) => {
    if (!canSubmitDraft(editDraft)) return;
    update(
      {
        id,
        payload: {
          name: editDraft.name.trim(),
          description: editDraft.description.trim(),
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
          <p className="mt-0.5 max-w-lg text-[11px] leading-relaxed text-muted-foreground">
            New conversations from the <strong className="font-medium text-foreground">embedded widget</strong>{" "}
            are auto-classified into one of these (or left Uncategorized). The{" "}
            <strong className="font-medium text-foreground">description</strong> is sent to the
            classifier — keep it short and include example phrases. Categories are per widget; the
            main portal chat is not auto-classified.
          </p>
        </div>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={openAdd} disabled={atCap || adding}>
          <Plus className="h-3.5 w-3.5" />
          New Category
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p className="leading-relaxed">
          Prefer <strong className="font-medium text-foreground">3–8</strong> distinct topics.
          Put specific categories above broad ones (order affects keyword fallback). Test on the
          live embed, not the main portal chat. Check Analytics → By category after a few chats.
        </p>
      </div>

      {atCap && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Limit reached — {MAX_CATEGORIES_PER_WIDGET} categories per widget.
        </p>
      )}

      {sorted.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/10 px-4 py-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div className="max-w-sm text-center">
            <p className="text-sm font-semibold">No categories yet</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Without categories, every widget conversation stays Uncategorized. Add a few topics
              with strong descriptions so the classifier can match visitor questions.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {canAddStarters && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleAddStarters}
                disabled={seeding}
              >
                {seeding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {seeding ? "Adding…" : `Add ${STARTER_CATEGORIES.length} starter categories`}
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" />
              Create one manually
            </Button>
          </div>

          {canAddStarters && (
            <ul className="w-full max-w-md space-y-1.5 rounded-lg border bg-card/60 p-3 text-left">
              {STARTER_CATEGORIES.map((c) => (
                <li key={c.name} className="text-xs">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-muted-foreground"> — </span>
                  <span className="text-muted-foreground line-clamp-1">{c.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((c, i) =>
            editingId === c.id ? (
              <div key={c.id} className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <CategoryFormFields draft={editDraft} onChange={setEditDraft} autoFocus />
                <div className="flex justify-end gap-1.5">
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
                    disabled={updating || !canSubmitDraft(editDraft)}
                    onClick={() => saveEdit(c.id)}
                  >
                    {updating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5"
              >
                <div className="flex shrink-0 flex-col pt-0.5">
                  <button
                    className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    title="Move up (higher priority for keyword fallback)"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === sorted.length - 1}
                    onClick={() => move(i, 1)}
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <code className="font-mono text-[10px] text-muted-foreground">{c.slug}</code>
                    {!c.is_active && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        Inactive
                      </span>
                    )}
                    {!c.description?.trim() && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400">
                        Needs description
                      </span>
                    )}
                  </div>
                  {c.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {c.description}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                      Add example phrases so the classifier can match this topic.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
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

      {adding && (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <CategoryFormFields draft={draft} onChange={setDraft} autoFocus />
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={creating || !canSubmitDraft(draft)}
              onClick={handleCreate}
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Create
            </Button>
          </div>
        </div>
      )}

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
