import { MeetingWorkspace } from "@/features/meeting/components/MeetingWorkspace";

export default async function MeetingMinutesResultPage({
    params,
}: {
    params: Promise<{ audioId: string }>;
}) {
    const { audioId } = await params;

    return <MeetingWorkspace audioId={audioId} />;
}
