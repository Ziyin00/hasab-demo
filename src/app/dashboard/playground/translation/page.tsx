import { PageHeader } from "@/components/common/PageHeader";

export default function TranslationPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Translation" 
        description="Translate your audio or text to over 100 languages" 
      />
      <div className="p-12 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground">
        Translation interface coming soon...
      </div>
    </div>
  );
}
