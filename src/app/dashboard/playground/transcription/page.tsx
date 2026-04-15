import { TranscriptionUploader } from "@/features/transcription/components/TranscriptionUploader";

export default function TranscriptionPlaygroundPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Transcription Playground</h1>
        <p className="text-muted-foreground">Upload your audio files and get instant transcriptions.</p>
      </div>
      <TranscriptionUploader />
    </div>
  );
}
