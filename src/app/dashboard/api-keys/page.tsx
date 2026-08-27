import { ApiKeysPage } from "@/features/widget/components/ApiKeysPage";
import { RequireOrgAdmin } from "@/components/auth/RequireAccess";

export const metadata = { title: "API Key — Hasab AI" };

export default function Page() {
  return (
    <RequireOrgAdmin fallbackHref="/dashboard/widgets">
      <ApiKeysPage />
    </RequireOrgAdmin>
  );
}
