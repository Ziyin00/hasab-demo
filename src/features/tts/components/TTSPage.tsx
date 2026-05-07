"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTTSSpeakers } from "../hooks/useTTSSpeakers";
import { TTSEditor } from "./TTSEditor";
import { TTSSidebar } from "./TTSSidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TTSPage() {
  useTTSSpeakers();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-1 min-h-0 border rounded-xl overflow-hidden bg-background">
        {/* Editor — always full-width on mobile, flex-1 on desktop */}
        <div className="flex-1 min-w-0">
          <TTSEditor onOpenSettings={() => setModalOpen(true)} />
        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden lg:flex lg:flex-col w-[300px] flex-shrink-0 border-l">
          <TTSSidebar />
        </div>
      </div>

      {/* Mobile: sidebar as a centered modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="lg:hidden p-0 gap-0 w-[calc(100vw-2rem)] max-w-sm h-[80vh] rounded-2xl flex flex-col overflow-hidden"
        >
          <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold">
              Settings & History
            </DialogTitle>
            <button
              onClick={() => setModalOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <TTSSidebar />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
