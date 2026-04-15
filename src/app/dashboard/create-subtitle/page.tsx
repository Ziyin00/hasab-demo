import { SubtitlesUploader } from "@/features/subtitles/components/SubtitlesUploader";

export default function CreateSubtitlePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create Smart Subtitles</h1>
        <p className="text-muted-foreground">Upload your video and choose a style to generate beautiful captions.</p>
      </div>
      <SubtitlesUploader />
    </div>
  );
}
