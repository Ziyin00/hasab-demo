import { TTSPage } from "@/features/tts/components/TTSPage";

export default function TTSPlaygroundPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      <div className="flex-shrink-0 mb-3">
        <h1 className="text-2xl font-semibold">Speech Synthesis</h1>
        <p className="text-sm text-muted-foreground">
          Generate natural-sounding speech from text
        </p>
      </div>
      <TTSPage />
    </div>
  );
}
