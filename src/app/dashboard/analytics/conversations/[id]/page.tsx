import { ConversationDetailPage } from "@/features/analytics/components/ConversationDetailPage";

export const metadata = { title: "Conversation — Hasab AI" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConversationDetailPage id={Number(id)} />;
}
