import { PageHeader } from "@/components/common/PageHeader";

export default function MeetingMinutesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Meeting Minutes" 
        description="Summarize your meetings and track action items" 
      />
      <div className="p-12 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground">
        Meeting Minutes interface coming soon...
      </div>
    </div>
  );
}
