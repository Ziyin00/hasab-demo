import { TranscriptionTable } from "@/features/history/components/TranscriptionTable";
import { TranslationTable } from "@/features/history/components/TranslationTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function HistoryPage() {
  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your previous jobs
        </p>
      </div>

      <Tabs defaultValue="transcription">
        <TabsList variant="line" className="border-b w-full rounded-none bg-transparent h-10 justify-start gap-6 px-0">
          <TabsTrigger value="transcription" className="px-0 text-sm font-medium">
            Transcription
          </TabsTrigger>
          <TabsTrigger value="translation" className="px-0 text-sm font-medium">
            Translation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcription" className="mt-4">
          <TranscriptionTable />
        </TabsContent>

        <TabsContent value="translation" className="mt-4">
          <TranslationTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
