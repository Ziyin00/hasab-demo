import { ContextPage } from "@/features/context/components/ContextPage";
import { RequireOrgAdmin } from "@/components/auth/RequireAccess";

export default function ContextPageRoute() {
  return (
    <RequireOrgAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">AI Context & Vocabulary</h1>
          <p className="text-sm text-muted-foreground">
            Manage custom contexts, vocabulary, and test your API integrations.
          </p>
        </div>
        <ContextPage />
      </div>
    </RequireOrgAdmin>
  );
}
