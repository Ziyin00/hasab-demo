"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, KeyRound, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apikeyApi } from "@/features/api-key/api/apikey.api";
import { useContextAccess } from "../hooks/useContextAccess";
import { AccessRequestCard } from "./AccessRequestCard";
import { TeamAccessTable } from "./TeamAccessTable";
import { ContextTable } from "./ContextTable";
import { ContextForm } from "./ContextForm";
import { LanguageHelperCard } from "./LanguageHelperCard";
import { ChatTestTab } from "./ChatTestTab";
import { SttTestTab } from "./SttTestTab";
import type { ContextItem } from "../types/context.types";

const API_KEY_STORAGE = "hasab_api_test_key";

export function ContextPage() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingContext, setEditingContext] = useState<ContextItem | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE) ?? "";
    setApiKeyInput(saved);
    setApiKey(saved);
  }, []);

  const {
    data: accessStatus,
    isLoading: accessLoading,
    refetch,
    isFetching,
  } = useContextAccess();

  const { mutate: autoLoad, isPending: autoLoading } = useMutation({
    mutationFn: apikeyApi.getApiKey,
    onSuccess: (key) => {
      setApiKeyInput(key);
      setApiKey(key);
      localStorage.setItem(API_KEY_STORAGE, key);
      toast.success("API key loaded from your account");
    },
    onError: () => toast.error("Failed to load API key"),
  });

  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE, trimmed);
      toast.success("API key saved");
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
      toast.info("API key cleared");
    }
  };

  const hasAccess = accessStatus?.has_access ?? false;
  const canGrant = accessStatus?.can_grant_access ?? false;

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
      {canGrant && <TeamAccessTable />}

      {/* API Key */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">API Key</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Used to authenticate context management, chat, and transcription requests.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-sm">Your Hasab API key</Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="HASAB_KEY_***..."
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowApiKey((v) => !v)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" onClick={saveApiKey}>
              Save Key
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => autoLoad()}
              disabled={autoLoading}
              className="gap-1.5"
            >
              {autoLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Auto Load
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Stored locally in your browser. Never share your API key in public repositories.
        </p>
      </div>

      {/* Tabs */}
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
              <LanguageHelperCard apiKey={apiKey} />
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
