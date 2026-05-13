import { ContextPage } from "@/features/context/components/ContextPage";

export default function ContextPageRoute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">AI Context & Vocabulary</h1>
        <p className="text-sm text-muted-foreground">
          Manage custom contexts, vocabulary, and test your API integrations.
        </p>
      </div>
      <ContextPage />
    </div>
  );
}
