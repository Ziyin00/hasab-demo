import { TranslationDetail } from "@/features/history/components/TranslationDetail";

export default async function TranslationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TranslationDetail id={Number(id)} />;
}
