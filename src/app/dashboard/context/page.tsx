import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function ContextPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title="AI Context & Vocabulary" 
        description="Add custom words, technical terms, and brand names to improve AI accuracy."
        action={<Button><Plus className="w-4 h-4 mr-2" /> Add Term</Button>}
      />
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input placeholder="Search terms..." className="max-w-xs" />
        </div>
        
        <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
          <p className="text-muted-foreground">You haven&apos;t added any custom context yet.</p>
          <Button variant="outline">Learn how context works</Button>
        </div>
      </div>
    </div>
  );
}
