import { TranscriptionWorkspace } from "@/features/transcription/components/TranscriptionWorkspace";

export default async function TranscriptionResultPage({
  params,
}: {
  params: Promise<{ audioId: string }>;
}) {
  const { audioId } = await params;

  return <TranscriptionWorkspace audioId={audioId} />;
}
