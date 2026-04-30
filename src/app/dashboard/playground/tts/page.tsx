import { TTSPage } from "@/features/tts/components/TTSPage";

export default function TTSPlaygroundPage() {
  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-semibold">Speech Synthesis</h1>
        <p className="text-sm text-muted-foreground">
          Generate natural-sounding speech from text
        </p>
      </div>
      <TTSPage />
    </div>
  );
}
