import { TranscriptionUploader } from "@/features/transcription/components/TranscriptionUploader";

export default function TranscriptionPlaygroundPage() {
  return (
    <div className="mx-auto w-full max-w-5xl -mt-5 space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Transcription</h1>
        <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
          Upload audio or video and generate transcript-ready outputs.
        </p>
      </div>
      <TranscriptionUploader />
    </div>
  );
}
