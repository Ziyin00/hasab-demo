import { ConversationDetailPage } from "@/features/analytics/components/ConversationDetailPage";
import { RequireOrgAdmin } from "@/components/auth/RequireAccess";

export const metadata = { title: "Conversation — Hasab AI" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireOrgAdmin fallbackHref="/dashboard/widgets">
      <ConversationDetailPage id={Number(id)} />
    </RequireOrgAdmin>
  );
}
