import { TranscriptionDetail } from "@/features/history/components/TranscriptionDetail";

export default async function TranscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TranscriptionDetail id={Number(id)} />;
}
