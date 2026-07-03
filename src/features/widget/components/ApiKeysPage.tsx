"use client";

import { useState, useEffect } from "react";
import {
  Copy, Check, RotateCw, Loader2, Eye, EyeOff,
  RefreshCw, KeyRound, AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useWidgetKeys } from "../hooks/useWidget";
import { apikeyApi } from "@/features/api-key/api/apikey.api";

const API_KEY_STORAGE = "hasab_api_test_key";

// ── Shared copy button ────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={handleCopy} title="Copy">
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

// ── Masked key display ────────────────────────────────────────────────────────

function MaskedKey({ value }: { value: string }) {
  const prefix = value.slice(0, 12);
  const dots = "•".repeat(Math.max(0, value.length - 12));
  return <span className="font-mono text-sm">{prefix}{dots}</span>;
}

// ── Widget key card ───────────────────────────────────────────────────────────

interface KeyCardProps {
  title: string;
  description: string;
  value: string;
  badge?: { label: string; color: string };
  action?: React.ReactNode;
  loading?: boolean;
}

function KeyCard({ title, description, value, badge, action, loading }: KeyCardProps) {
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
          <code className="flex-1 text-sm font-mono text-foreground truncate">{value}</code>
        )}
        {badge && !loading && (
          <span
            className="shrink-0 rounded text-[10px] font-bold px-1.5 py-0.5 uppercase"
            style={{ background: badge.color + "20", color: badge.color }}
          >
            {badge.label}
          </span>
        )}
        {!loading && <CopyButton text={value} />}
        {action && !loading && action}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ApiKeysPage() {
  const queryClient = useQueryClient();
  const { data: keys, isLoading: keysLoading } = useWidgetKeys();

  // Fetch the API key on mount
  const { data: apiKey, isLoading: keyLoading, isError: keyError } = useQuery({
    queryKey: ["hasab-api-key"],
    queryFn: apikeyApi.getApiKey,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Sync fetched key to localStorage so context page STT/chat tests can use it
  useEffect(() => {
    if (apiKey) localStorage.setItem(API_KEY_STORAGE, apiKey);
  }, [apiKey]);

  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Manual key input (for testing overrides)
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE) ?? "";
    setApiKeyInput(saved);
  }, []);

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

  const { mutate: autoLoad, isPending: autoLoading } = useMutation({
    mutationFn: apikeyApi.getApiKey,
    onSuccess: (key) => {
      setApiKeyInput(key);
      localStorage.setItem(API_KEY_STORAGE, key);
      toast.success("API key loaded from your account");
    },
    onError: () => toast.error("Failed to load API key"),
  });

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const { mutate: regenerate, isPending: regenerating } = useMutation({
    mutationFn: apikeyApi.regenerateApiKey,
    onSuccess: (newKey) => {
      queryClient.setQueryData(["hasab-api-key"], newKey);
      localStorage.setItem(API_KEY_STORAGE, newKey);
      setConfirmOpen(false);
      setRevealed(false);
      toast.success("API key regenerated", {
        description: "Update any integrations using the old key.",
      });
    },
    onError: () => toast.error("Failed to regenerate API key"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">API Keys</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your Widget Key IDs authenticate browser requests via RSA signatures. The Hasab API Key is for server-side use only — never embed it in browser code.
        </p>
      </div>

      {/* ── Hasab API Key ── */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Hasab API Key</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              For server-side and admin dashboard use only —{" "}
              <span className="text-destructive font-medium">never embed in browser code</span>.
              Used for context management, analytics, and admin chat API calls.
            </p>
          </div>
        </div>

        {/* Key display row */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
          {keyLoading ? (
            <Skeleton className="h-4 flex-1" />
          ) : keyError || !apiKey ? (
            <span className="text-sm text-muted-foreground italic flex-1">Failed to load key</span>
          ) : (
            <span className="flex-1 min-w-0 truncate select-all">
              {revealed
                ? <span className="font-mono text-sm">{apiKey}</span>
                : <MaskedKey value={apiKey} />}
            </span>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setRevealed((v) => !v)}
              disabled={!apiKey}
              title={revealed ? "Hide key" : "Reveal key"}
            >
              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              disabled={!apiKey}
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Keep your API key secret. Never share it in public repositories or client-side code.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setConfirmOpen(true)}
            disabled={keyLoading || regenerating}
          >
            {regenerating
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
            Regenerate
          </Button>
        </div>

        <Separator />

        {/* Manual key input */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Use a different key for testing
          </Label>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="relative flex-1">
              <Input
                type={showApiKeyInput ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="HASAB_KEY_***..."
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowApiKeyInput((v) => !v)}
              >
                {showApiKeyInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={saveApiKey}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => autoLoad()}
                disabled={autoLoading}
              >
                {autoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Auto Load
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Stored locally in your browser. Used by context management and test tabs.
          </p>
        </div>
      </div>

      {/* ── Widget Keys ── */}
      <KeyCard
        title="Widget Key ID — Live"
        description="Use this as data-public-key in your embed snippet. Sent as X-Widget-Key-Id on every browser request to /api/widget/*. Safe to expose in browser code."
        value={keys?.public_key ?? "WIDGET_KEY_••••••••••••••••••••••••••••••••••••"}
        badge={{ label: "LIVE", color: "#22c55e" }}
        loading={keysLoading}
      />

      <KeyCard
        title="Widget Key ID — Test"
        description="Same as the live key but rate-limited and billed separately. Use in development and staging environments."
        value={keys?.test_key ?? "WIDGET_KEY_test_••••••••••••••••••••••••••••••"}
        badge={{ label: "TEST", color: "#f59e0b" }}
        loading={keysLoading}
      />

      {/* ── Anthropic API Key ── */}
      <div className="rounded-xl border border-destructive/30 bg-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-destructive">Anthropic API Key</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Used server-side to call Claude. Stored encrypted — never returned to the browser or included in widget code.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
          {keysLoading ? (
            <Skeleton className="h-4 flex-1" />
          ) : (
            <code className="flex-1 text-sm font-mono text-foreground truncate">
              {keys?.anthropic_key_masked ?? "sk-ant-••••••••••••••••••••••••••••••••••••••"}
            </code>
          )}
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs shrink-0" disabled={keysLoading}>
            <RotateCw className="h-3.5 w-3.5" />
            Rotate
          </Button>
        </div>
      </div>

      {/* ── Regenerate confirmation dialog ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <DialogTitle>Regenerate API Key?</DialogTitle>
            </div>
            <DialogDescription>
              Your current key will be immediately invalidated. Any integrations
              or services using it will stop working until updated with the new key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={regenerating}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => regenerate()}
              disabled={regenerating}
              className="gap-2"
            >
              {regenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Yes, regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
