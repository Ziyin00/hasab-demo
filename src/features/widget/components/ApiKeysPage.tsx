"use client";

import { useState } from "react";
import { Copy, Check, RotateCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetKeys } from "../hooks/useWidget";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">API Keys</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          The public key is safe to include in frontend code. The Anthropic key never leaves
          your server.
        </p>
      </div>

      <KeyCard
        title="Public Widget Key"
        description="Add this to your data-public-key attribute. Safe to expose in browser code."
        value={keys?.public_key ?? "pk_live_••••••••••••••••••••••••••••••••••••"}
        badge={{ label: "LIVE", color: "#22c55e" }}
        loading={isLoading}
      />

      <KeyCard
        title="Test Key"
        description="Use this in development. Rate-limited, no billing charges."
        value={keys?.test_key ?? "pk_test_••••••••••••••••••••••••••••••"}
        badge={{ label: "TEST", color: "#f59e0b" }}
        loading={isLoading}
      />

      <div className="rounded-xl border border-destructive/30 bg-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-destructive">Anthropic API Key</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stored encrypted on our servers. Never returned to the browser or included in
            widget code.
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
