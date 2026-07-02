"use client";

import { useState, useEffect } from "react";
import { Copy, Check, RotateCw, Loader2, Eye, EyeOff, RefreshCw, KeyRound } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWidgetKeys } from "../hooks/useWidget";
import { apikeyApi } from "@/features/api-key/api/apikey.api";

const API_KEY_STORAGE = "hasab_api_test_key";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

interface KeyCardProps {
  title: string;
  description: string;
  value: string;
  badge?: { label: string; color: string };
  action?: React.ReactNode;
  masked?: boolean;
  loading?: boolean;
}

function KeyCard({ title, description, value, badge, action, masked, loading }: KeyCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
        {loading ? (
          <Skeleton className="h-4 flex-1" />
        ) : (
          <code className="flex-1 text-sm font-mono text-foreground truncate">
            {masked ? value : value}
          </code>
        )}
        {badge && !loading && (
          <span
            className="shrink-0 rounded text-[10px] font-bold px-1.5 py-0.5 uppercase"
            style={{ background: badge.color + "20", color: badge.color }}
          >
            {badge.label}
          </span>
        )}
        {!masked && !loading && <CopyButton text={value} />}
        {action && !loading && action}
      </div>
    </div>
  );
}

export function ApiKeysPage() {
  const { data: keys, isLoading } = useWidgetKeys();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE) ?? "";
    setApiKeyInput(saved);
  }, []);

  const { mutate: autoLoad, isPending: autoLoading } = useMutation({
    mutationFn: apikeyApi.getApiKey,
    onSuccess: (key) => {
      setApiKeyInput(key);
      localStorage.setItem(API_KEY_STORAGE, key);
      toast.success("API key loaded from your account");
    },
    onError: () => toast.error("Failed to load API key"),
  });

  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE, trimmed);
      toast.success("API key saved");
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
      toast.info("API key cleared");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">API Keys</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your Widget Key IDs authenticate browser requests via RSA signatures. The Hasab API Key is for server-side use only — never embed it in browser code.
        </p>
      </div>

      {/* Hasab API Key */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Hasab API Key</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              For server-side and admin dashboard use only — <span className="text-destructive font-medium">never embed in browser code</span>. Used for context management, analytics, and admin chat API calls.
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

      {/* Widget Keys */}
      <KeyCard
        title="Widget Key ID — Live"
        description='Use this as data-public-key in your embed snippet. Sent as X-Widget-Key-Id on every browser request to /api/widget/*. Safe to expose in browser code.'
        value={keys?.public_key ?? "WIDGET_KEY_••••••••••••••••••••••••••••••••••••"}
        badge={{ label: "LIVE", color: "#22c55e" }}
        loading={isLoading}
      />

      <KeyCard
        title="Widget Key ID — Test"
        description="Same as the live key but rate-limited and billed separately. Use in development and staging environments."
        value={keys?.test_key ?? "WIDGET_KEY_test_••••••••••••••••••••••••••••••"}
        badge={{ label: "TEST", color: "#f59e0b" }}
        loading={isLoading}
      />

      <div className="rounded-xl border border-destructive/30 bg-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-destructive">Anthropic API Key</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Used server-side to call Claude. Stored encrypted — never returned to the browser or included in widget code.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
          {isLoading ? (
            <Skeleton className="h-4 flex-1" />
          ) : (
            <code className="flex-1 text-sm font-mono text-foreground truncate">
              {keys?.anthropic_key_masked ?? "sk-ant-••••••••••••••••••••••••••••••••••••••"}
            </code>
          )}
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs shrink-0" disabled={isLoading}>
            <RotateCw className="h-3.5 w-3.5" />
            Rotate
          </Button>
        </div>
      </div>
    </div>
  );
}
