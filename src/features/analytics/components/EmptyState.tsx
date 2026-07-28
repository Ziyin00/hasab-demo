"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  className?: string;
}

export function EmptyState({ icon: Icon, message, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-6 text-center", className)}>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted/80">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="max-w-[220px] text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
