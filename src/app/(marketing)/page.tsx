export default function LandingPage() {
  return (
    <div className="container mx-auto px-6 py-20 flex flex-col items-center text-center">
      <h1 className="text-5xl font-bold mb-6">Smarter AI for Your Content</h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-10">
        Transcription, Translation, Subtitles and more. Powered by Hasab AI.
      </p>
      <div className="flex gap-4">
        <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium">
          Get Started
        </button>
        <button className="border px-8 py-3 rounded-lg font-medium">
          View Demo
        </button>
      </div>
    </div>
  );
}
