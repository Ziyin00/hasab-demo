import { PageHeader } from "@/components/common/PageHeader";

export default function APIKeysPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="API Keys" 
        description="Manage your API keys for programmatic access" 
      />
      <div className="p-12 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground">
        API Keys management coming soon...
      </div>
    </div>
  );
}
