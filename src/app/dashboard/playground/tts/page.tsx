import { PageHeader } from "@/components/common/PageHeader";

export default function TTSPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Text to Speech" 
        description="Generate natural voices for your content" 
      />
      <div className="p-12 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground">
        TTS interface coming soon...
      </div>
    </div>
  );
}
