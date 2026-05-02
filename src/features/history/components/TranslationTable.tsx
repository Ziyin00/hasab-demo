"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Eye, Trash2, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslationHistory } from "../hooks/useTranslationHistory";
import { historyApi } from "../api/history.api";
import { TablePagination } from "./TablePagination";
import { TranslationDrawer } from "./TranslationDrawer";
import type { TranslationRecord } from "../types/history.types";

const LANG_NAMES: Record<string, string> = {
  amh: "Amharic",
  orm: "Oromo",
  eng: "English",
  fra: "French",
  ara: "Arabic",
  som: "Somali",
};

function langLabel(code: string) {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TranslationTable() {
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TranslationRecord | null>(null);
  const { data, isLoading } = useTranslationHistory(page);
  const queryClient = useQueryClient();

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await historyApi.deleteTranslation(id);
      toast.success("Deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["history", "translation"] });
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const records = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;
  const total = data?.total ?? 0;

  return (
    <>
      <TranslationDrawer
        record={selectedRecord}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div>
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Source Text</TableHead>
              <TableHead className="hidden sm:table-cell">From</TableHead>
              <TableHead className="hidden sm:table-cell">To</TableHead>
              <TableHead className="hidden md:table-cell">Characters</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No translations yet
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell className="max-w-[220px]">
                    <p className="truncate text-sm">{r.source_text}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {langLabel(r.source_language)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {langLabel(r.target_language)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {r.character_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {formatDate(r.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          {deleting === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => { setSelectedRecord(r); setDrawerOpen(true); }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {total > 0 && (
        <TablePagination page={page} lastPage={lastPage} total={total} onPage={setPage} />
      )}
    </div>
    </>
  );
}
