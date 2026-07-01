"use client";

import { useState, useMemo } from "react";
import { MoreHorizontal, Eye, Copy, Pencil, Trash2, Loader2, ExternalLink, Database } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useContexts, useDeleteContext, useUpdateContext } from "../hooks/useContexts";
import { ContextPreviewDialog } from "./ContextPreviewDialog";
import type { ContextItem } from "../types/context.types";

type StatusFilter = "all" | "active" | "inactive";

interface Props {
  apiKey: string;
  onEdit: (context: ContextItem) => void;
}

export function ContextTable({ apiKey, onEdit }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [previewContext, setPreviewContext] = useState<ContextItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: contexts, isLoading } = useContexts(apiKey);
  const { mutate: deleteContext } = useDeleteContext(apiKey);
  const { mutate: updateContext } = useUpdateContext(apiKey);

  const filtered = useMemo(() => {
    const list = contexts ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (statusFilter === "active") return c.is_active;
      if (statusFilter === "inactive") return !c.is_active;
      return true;
    });
  }, [contexts, search, statusFilter]);

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteContext(id, { onSettled: () => setDeletingId(null) });
  };

  const handleToggle = (context: ContextItem) => {
    updateContext({ id: context.id, data: { is_active: !context.is_active } });
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!apiKey) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">
        Add your API key above to manage contexts.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs font-medium">Name</TableHead>
                <TableHead className="text-xs font-medium">Priority</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">
                  Preview
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-sm text-muted-foreground"
                  >
                    {(contexts?.length ?? 0) === 0
                      ? "No contexts yet. Create your first one."
                      : "No contexts match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((context) => {
                  const isRag = !!context.rag_store_id;
                  return (
                    <TableRow key={context.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          {context.name}
                          {isRag && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5"
                            >
                              <Database className="h-2.5 w-2.5" />
                              KB
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {context.priority}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            context.is_active
                              ? "border-green-500/30 text-green-500 bg-green-500/10"
                              : "border-muted-foreground/30 text-muted-foreground bg-muted/30"
                          }`}
                        >
                          {context.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[200px]">
                        {isRag ? (
                          <Link
                            href="/dashboard/knowledge-base"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Manage in Knowledge Base
                          </Link>
                        ) : (
                          <p className="truncate">
                            {(context.context_data || "").slice(0, 60)}
                            {(context.context_data || "").length > 60 ? "..." : ""}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {isRag ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href="/dashboard/knowledge-base">
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </Link>
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                {deletingId === context.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setPreviewContext(context)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopy(context.context_data)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(context)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggle(context)}>
                                <span className="h-4 w-4 mr-2 inline-flex items-center justify-center text-[10px] font-bold">
                                  {context.is_active ? "○" : "●"}
                                </span>
                                {context.is_active ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(context.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ContextPreviewDialog
        context={previewContext}
        onClose={() => setPreviewContext(null)}
      />
    </>
  );
}
