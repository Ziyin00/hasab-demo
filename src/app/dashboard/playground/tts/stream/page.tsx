import { StreamTTSPage } from "@/features/tts/components/StreamTTSPage";

export default function TTSStreamPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-2xl font-semibold">Streaming TTS</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Stream speech in real-time from text input
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <StreamTTSPage />
      </div>
    </div>
  );
}
