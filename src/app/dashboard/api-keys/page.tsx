import { PageHeader } from "@/components/common/PageHeader";
import { ApiKeyCard } from "@/features/api-key/components/ApiKeyCard";

export default function APIKeysPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="API Keys"
        description="Manage your API keys for programmatic access"
      />
      <ApiKeyCard />
    </div>
  );
}
