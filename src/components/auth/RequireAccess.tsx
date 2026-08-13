"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAccess } from "@/hooks/useAccess";
import type { AccessLevel } from "@/lib/userAccess";

interface RequireAccessProps {
  level: AccessLevel;
  children: React.ReactNode;
  /** Where to send unauthorized users */
  fallbackHref?: string;
  /** Soft message shown once on redirect */
  message?: string;
}

/**
 * Client-side role gate (auth cookie still enforced by middleware).
 * Mirrors hasab-dashboard-v2 route ternaries with isOrgUser / isOrgAdmin.
 */
export function RequireAccess({
  level,
  children,
  fallbackHref = "/dashboard/widgets",
  message,
}: RequireAccessProps) {
  const router = useRouter();
  const { initialized, can } = useAccess();
  const allowed = can(level);

  useEffect(() => {
    if (!initialized) return;
    if (allowed) return;
    toast.error(
      message ??
        (level === "admin"
          ? "Admin access required"
          : "Organization access required")
    );
    router.replace(fallbackHref);
  }, [initialized, allowed, level, message, fallbackHref, router]);

  if (!initialized) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
}

export function RequireOrgUser({
  children,
  fallbackHref,
}: {
  children: React.ReactNode;
  fallbackHref?: string;
}) {
  return (
    <RequireAccess level="org" fallbackHref={fallbackHref}>
      {children}
    </RequireAccess>
  );
}

export function RequireOrgAdmin({
  children,
  fallbackHref = "/dashboard/widgets",
}: {
  children: React.ReactNode;
  fallbackHref?: string;
}) {
  return (
    <RequireAccess level="admin" fallbackHref={fallbackHref}>
      {children}
    </RequireAccess>
  );
}
