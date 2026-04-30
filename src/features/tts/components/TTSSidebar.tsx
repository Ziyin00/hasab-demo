"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TTSSettingsPanel } from "./TTSSettingsPanel";
import { TTSHistoryPanel } from "./TTSHistoryPanel";

export function TTSSidebar() {
  return (
    <Tabs defaultValue="settings" className="flex flex-col h-full border-l">
      <TabsList
        variant="line"
        className="w-full rounded-none border-b h-12 bg-transparent px-4 justify-start gap-4"
      >
        <TabsTrigger value="settings" className="text-sm font-medium px-0">
          Settings
        </TabsTrigger>
        <TabsTrigger value="history" className="text-sm font-medium px-0">
          History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="settings" className="flex-1 m-0 overflow-y-auto">
        <TTSSettingsPanel />
      </TabsContent>
      <TabsContent value="history" className="flex-1 m-0 overflow-y-auto">
        <TTSHistoryPanel />
      </TabsContent>
    </Tabs>
  );
}
