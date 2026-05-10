import Link from "next/link";
import { Mic2, Radio, ArrowRight } from "lucide-react";

export default function TTSPlaygroundPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      <div className="flex-shrink-0 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Speech Synthesis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose a synthesis mode to get started
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        <Link
          href="/dashboard/playground/tts/text"
          className="group rounded-xl border bg-card px-7 py-8 flex flex-col gap-5 hover:border-primary/40 hover:bg-muted/30 transition-colors"
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mic2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold">Text to Speech</p>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Convert written text into natural-sounding audio. Choose voice, speed, and language.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-primary transition-colors font-medium">
            Get started
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/dashboard/playground/tts/stream"
          className="group rounded-xl border bg-card px-7 py-8 flex flex-col gap-5 hover:border-primary/40 hover:bg-muted/30 transition-colors"
        >
          <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Radio className="h-6 w-6 text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold">Streaming TTS</p>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Stream speech in real-time from an uploaded audio file or live text input.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-primary transition-colors font-medium">
            Get started
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
