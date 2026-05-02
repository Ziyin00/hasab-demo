import { MeetingPlayground } from "@/features/meeting/components/MeetingPlayground";

export default function MeetingMinutesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl -mt-5 space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Meeting minutes</h1>
        <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
          Upload a recording and get a structured summary you can export or inspect as JSON.
        </p>
      </div>
      <MeetingPlayground />
    </div>
  );
}
