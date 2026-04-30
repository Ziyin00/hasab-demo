"use client";

import { useTTSSpeakers } from "../hooks/useTTSSpeakers";
import { TTSEditor } from "./TTSEditor";
import { TTSSidebar } from "./TTSSidebar";

export function TTSPage() {
  useTTSSpeakers();

  return (
    <div className="flex h-[calc(100vh-130px)] border rounded-xl overflow-hidden bg-background">
      <div className="flex-1 min-w-0">
        <TTSEditor />
      </div>
      <div className="w-[300px] flex-shrink-0">
        <TTSSidebar />
      </div>
    </div>
  );
}
