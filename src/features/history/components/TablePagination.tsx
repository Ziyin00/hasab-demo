"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  lastPage: number;
  total: number;
  onPage: (p: number) => void;
}

export function TablePagination({ page, lastPage, total, onPage }: Props) {
  return (
    <div className="flex items-center justify-between px-1 py-3 border-t">
      <p className="text-xs text-muted-foreground">{total} total records</p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs px-2">
          {page} / {lastPage}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPage(page + 1)}
          disabled={page >= lastPage}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
