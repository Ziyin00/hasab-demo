"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { TelegramAccessControl } from "../types/telegram-bot.types";

interface AccessEditorProps {
  access: TelegramAccessControl;
  onAccessCopyChange: (patch: Partial<TelegramAccessControl>) => void;
  onSaveAccess: (payload: { phones?: string[]; enabled?: boolean }) => void;
  saving?: boolean;
}

export function AccessEditor({
  access,
  onAccessCopyChange,
  onSaveAccess,
  saving,
}: AccessEditorProps) {
  const [phonesRaw, setPhonesRaw] = useState("");
  const [localEnabled, setLocalEnabled] = useState(access.enabled);

  useEffect(() => {
    setLocalEnabled(access.enabled);
  }, [access.enabled]);

  const parsePhones = (raw: string): string[] =>
    raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Phone allowlist</p>
          <p className="text-xs text-muted-foreground">
            When enabled, unknown visitors must share their phone before chatting.
          </p>
        </div>
        <Switch
          checked={localEnabled}
          onCheckedChange={(v) => {
            setLocalEnabled(v);
            if (!v) onSaveAccess({ enabled: false });
          }}
          disabled={saving}
        />
      </div>

      <div className="rounded-xl border bg-muted/10 px-4 py-3">
        <p className="text-xs font-semibold">Stored allowlist</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Plaintext phones are never returned — only last 4 digits.
        </p>
        {access.allowed_count === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No phones on the allowlist yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {access.allowed_phones.map((p, i) => (
              <span
                key={`${p.last4}-${i}`}
                className="rounded-md border bg-background px-2 py-1 font-mono text-[11px]"
              >
                ••••{p.last4 ?? "????"}
              </span>
            ))}
            <span className="self-center text-[11px] text-muted-foreground">
              {access.allowed_count} total
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Replace allowlist (E.164)
        </Label>
        <Textarea
          value={phonesRaw}
          onChange={(e) => setPhonesRaw(e.target.value)}
          placeholder={"+251911223344\n+251922334455"}
          rows={4}
          className="resize-none font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          One phone per line (or comma-separated). Prefer{" "}
          <code className="rounded bg-muted px-1 font-mono">+251…</code>. Saving replaces the full
          list.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="gap-2"
          disabled={saving || (!phonesRaw.trim() && !localEnabled)}
          onClick={() => {
            const phones = parsePhones(phonesRaw);
            onSaveAccess({
              phones: phones.length ? phones : undefined,
              enabled: localEnabled,
            });
            setPhonesRaw("");
          }}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Save access
        </Button>
        {access.allowed_count > 0 && (
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={saving}
            onClick={() => {
              onSaveAccess({ phones: [], enabled: false });
              setLocalEnabled(false);
              setPhonesRaw("");
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear list & disable
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-1">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Prompt message</Label>
          <Input
            value={access.prompt_message ?? ""}
            onChange={(e) => onAccessCopyChange({ prompt_message: e.target.value })}
            placeholder="Share your phone number to continue."
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Denied message</Label>
          <Input
            value={access.denied_message ?? ""}
            onChange={(e) => onAccessCopyChange({ denied_message: e.target.value })}
            placeholder="You are not authorized to use this bot."
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Share button text</Label>
          <Input
            value={access.share_button_text ?? ""}
            onChange={(e) => onAccessCopyChange({ share_button_text: e.target.value })}
            placeholder="Share phone number"
            className="text-sm"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Prompt / denied / button copy are saved with the main Save button (PATCH settings).
        </p>
      </div>
    </div>
  );
}
