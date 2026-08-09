import { AnalyticsPage } from "@/features/analytics/components/AnalyticsPage";
import { RequireOrgAdmin } from "@/components/auth/RequireAccess";

export const metadata = { title: "Analytics — Hasab AI" };

export default function Page() {
  return (
    <RequireOrgAdmin fallbackHref="/dashboard/widgets">
      <AnalyticsPage />
    </RequireOrgAdmin>
  );
}
