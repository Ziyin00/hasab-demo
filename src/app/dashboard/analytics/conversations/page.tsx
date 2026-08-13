import { ConversationsPage } from "@/features/analytics/components/ConversationsPage";
import { RequireOrgAdmin } from "@/components/auth/RequireAccess";

export const metadata = { title: "Conversations — Hasab AI" };

export default function Page() {
  return (
    <RequireOrgAdmin fallbackHref="/dashboard/widgets">
      <ConversationsPage />
    </RequireOrgAdmin>
  );
}
