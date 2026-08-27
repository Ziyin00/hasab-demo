"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAccess } from "@/hooks/useAccess";

/** Send admins to Analytics; org members to Widgets. */
export default function DashboardPage() {
  const router = useRouter();
  const { initialized, isOrgAdmin } = useAccess();

  useEffect(() => {
    if (!initialized) return;
    router.replace(isOrgAdmin ? "/dashboard/analytics" : "/dashboard/widgets");
  }, [initialized, isOrgAdmin, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}
