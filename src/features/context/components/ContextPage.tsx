"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContextAccess } from "../hooks/useContextAccess";
import { AccessRequestCard } from "./AccessRequestCard";
import { ContextTable } from "./ContextTable";
import { ContextForm } from "./ContextForm";
import { LanguageHelperCard } from "./LanguageHelperCard";
import { ChatTestTab } from "./ChatTestTab";
import { SttTestTab } from "./SttTestTab";
import type { ContextItem } from "../types/context.types";

const API_KEY_STORAGE = "hasab_api_test_key";

export function ContextPage() {
  const [apiKey, setApiKey] = useState("");
  const [editingContext, setEditingContext] = useState<ContextItem | null>(null);

  useEffect(() => {
    setApiKey(localStorage.getItem(API_KEY_STORAGE) ?? "");
  }, []);

  const {
    data: accessStatus,
    isLoading: accessLoading,
    refetch,
    isFetching,
  } = useContextAccess();

  const hasAccess = accessStatus?.has_access ?? false;

  if (accessLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <AccessRequestCard
        status={accessStatus}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="contexts">
        <TabsList>
          <TabsTrigger value="contexts">Contexts</TabsTrigger>
          <TabsTrigger value="chat">Chat Test</TabsTrigger>
          <TabsTrigger value="stt">Speech-to-Text</TabsTrigger>
        </TabsList>

        <TabsContent value="contexts" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_370px]">
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">Existing Contexts</h2>
                <p className="text-sm text-muted-foreground">
                  Active contexts are automatically injected into chat API requests.
                </p>
              </div>
              <ContextTable apiKey={apiKey} onEdit={setEditingContext} />
            </div>

            <div className="space-y-4 self-start lg:sticky lg:top-10">
              <ContextForm
                apiKey={apiKey}
                editingContext={editingContext}
                onCancelEdit={() => setEditingContext(null)}
              />
              <LanguageHelperCard />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-5">
          <ChatTestTab apiKey={apiKey} />
        </TabsContent>

        <TabsContent value="stt" className="mt-5">
          <SttTestTab apiKey={apiKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
