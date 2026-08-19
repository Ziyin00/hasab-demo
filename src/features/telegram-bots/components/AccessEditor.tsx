"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Maximize2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useImportTelegramAccess,
  useRemoveTelegramAccessPhones,
  useUpdateTelegramAccess,
} from "../hooks/useTelegramBots";
import type {
  AccessPhoneMask,
  TelegramAccessControl,
  TelegramAccessImportMode,
  TelegramBot,
} from "../types/telegram-bot.types";

const ALLOWED_EXT = [".xlsx", ".xlsm", ".csv", ".txt"];
const MAX_JSON_PHONES = 500;
const MAX_REMOVE_JSON_PHONES = 2000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PAGE_SIZE = 10;

interface AccessEditorProps {
  botId: number;
  access: TelegramAccessControl;
  onAccessCopyChange: (patch: Partial<TelegramAccessControl>) => void;
  onBotUpdated: (bot: TelegramBot) => void;
}

function normalizePhoneToE164(token: string): string | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/[^\d]/g, "");
    if (digits.length < 7 || digits.length > 15) return null;
    return `+${digits}`;
  }

  let digits = trimmed.replace(/[^\d]/g, "");
  if (!digits || digits.length < 7) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
    if (digits.length < 7 || digits.length > 15) return null;
    return `+${digits}`;
  }

  // Ethiopian local: 09xx, 07xx
  if ((digits.startsWith("09") || digits.startsWith("07")) && digits.length >= 10) {
    return `+251${digits.slice(1)}`;
  }

  // Other local starting with 0 — assume Ethiopia
  if (digits.startsWith("0") && digits.length >= 10) {
    return `+251${digits.slice(1)}`;
  }

  // Bare 9-digit Ethiopian (starts with 9 or 7)
  if ((digits.startsWith("9") || digits.startsWith("7")) && digits.length === 9) {
    return `+251${digits}`;
  }

  // 10–15 digits without leading 0 → treat as full international (missing +)
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

function parsePhones(
  raw: string
): {
  phones: string[];
  invalidCount: number;
} {
  const tokens = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const normalized = tokens
    .map((t) => normalizePhoneToE164(t))
    .filter((v): v is string => Boolean(v));

  // Dedupe after normalization.
  const unique = Array.from(new Set(normalized));

  return { phones: unique, invalidCount: Math.max(tokens.length - normalized.length, 0) };
}

function isLegacyXls(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".xls") && !lower.endsWith(".xlsx") && !lower.endsWith(".xlsm");
}

function isAllowedFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_EXT.some((ext) => lower.endsWith(ext));
}

function downloadTemplate() {
  const csv = "phone\n+251911223344\n+251922334455\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "telegram-bot-allowlist.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type PendingDelete =
  | { kind: "chip"; chip: AccessPhoneMask }
  | { kind: "typed-remove"; phones: string[] }
  | { kind: "typed-replace"; phones: string[] }
  | { kind: "file-remove" }
  | { kind: "file-replace" }
  | { kind: "bulk"; ids: string[] }
  | { kind: "clear" };

function deleteCopy(pending: PendingDelete): { title: string; description: string; confirm: string } {
  switch (pending.kind) {
    case "chip":
      return {
        title: pending.chip.last4
          ? `Remove number ending in ${pending.chip.last4}?`
          : "Remove this number?",
        description:
          "This number will lose access immediately. Full numbers aren’t stored, so you’ll need the original number or a spreadsheet to add it back.",
        confirm: "Remove number",
      };
    case "typed-remove":
      return {
        title: `Remove ${pending.phones.length} ${pending.phones.length === 1 ? "number" : "numbers"}?`,
        description: "Matching numbers will be dropped from the allowlist. Numbers not on the list are ignored.",
        confirm: pending.phones.length === 1 ? "Remove number" : "Remove numbers",
      };
    case "typed-replace":
      return {
        title: "Replace the entire allowlist?",
        description: `The current list will be deleted and replaced with ${pending.phones.length} ${
          pending.phones.length === 1 ? "number" : "numbers"
        }. This cannot be undone from the portal.`,
        confirm: "Replace list",
      };
    case "file-remove":
      return {
        title: "Remove numbers from this file?",
        description:
          "Matching numbers in the file will be dropped. Others on the allowlist stay. Full numbers aren’t stored after save.",
        confirm: "Remove numbers",
      };
    case "file-replace":
      return {
        title: "Replace the entire allowlist?",
        description:
          "The current list will be deleted. The uploaded file becomes the full allowlist. This cannot be undone from the portal.",
        confirm: "Replace list",
      };
    case "bulk":
      return {
        title: `Remove ${pending.ids.length} ${pending.ids.length === 1 ? "number" : "numbers"}?`,
        description:
          "Selected numbers will lose access immediately. Full numbers aren’t stored, so you’ll need the original list to add them back.",
        confirm: pending.ids.length === 1 ? "Remove number" : "Remove selected",
      };
    case "clear":
      return {
        title: "Clear the allowlist?",
        description:
          "Full numbers aren’t stored, so this cannot be undone from the portal. Restriction will be turned off. Re-upload a spreadsheet to restore access.",
        confirm: "Clear list",
      };
  }
}

export function AccessEditor({
  botId,
  access,
  onAccessCopyChange,
  onBotUpdated,
}: AccessEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phonesRaw, setPhonesRaw] = useState("");
  const [textareaMode, setTextareaMode] = useState<TelegramAccessImportMode>("merge");
  const [localEnabled, setLocalEnabled] = useState(access.enabled);
  const [file, setFile] = useState<File | null>(null);
  const [fileMode, setFileMode] = useState<TelegramAccessImportMode>("replace");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const chipRowRef = useRef<HTMLDivElement>(null);
  const [chipsOverflow, setChipsOverflow] = useState(false);

  const { mutate: updateAccess, isPending: saving } = useUpdateTelegramAccess();
  const { mutate: importAccess, isPending: importing } = useImportTelegramAccess();
  const { mutate: removePhones, isPending: removing } = useRemoveTelegramAccessPhones();
  const busy = saving || importing || removing;

  useEffect(() => {
    setLocalEnabled(access.enabled);
  }, [access.enabled]);

  const applyBot = (bot: TelegramBot) => {
    onBotUpdated(bot);
    const remaining = new Set(
      (bot.settings?.access_control?.allowed_phones ?? []).map((p) => p.id).filter(Boolean)
    );
    setSelected((prev) => new Set([...prev].filter((id) => remaining.has(id))));
    if ((bot.settings?.access_control?.allowed_count ?? 0) === 0) {
      setListOpen(false);
    }
  };

  const handleToggle = (enabled: boolean) => {
    setLocalEnabled(enabled);
    if (!enabled) {
      updateAccess(
        { id: botId, payload: { enabled: false } },
        {
          onSuccess: (bot) => {
            applyBot(bot);
            toast.success("Phone restriction turned off. The allowlist is kept.");
          },
        }
      );
      return;
    }
    if (access.allowed_count === 0) {
      toast.message("Upload a phone list or add at least one number to turn restriction on.");
      return;
    }
    updateAccess(
      { id: botId, payload: { enabled: true } },
      {
        onSuccess: (bot) => {
          applyBot(bot);
          toast.success("Only listed phone numbers can chat.");
        },
      }
    );
  };

  const handleSavePhones = () => {
    const { phones, invalidCount } = parsePhones(phonesRaw);
    if (invalidCount > 0) {
      toast.message(`Skipped ${invalidCount} invalid phone value${invalidCount === 1 ? "" : "s"}.`);
    }
    if (phones.length === 0) {
      toast.error(
        textareaMode === "remove"
          ? "Enter a number or select a chip to remove."
          : "Add at least one valid phone number."
      );
      return;
    }

    const maxPhones = textareaMode === "remove" ? MAX_REMOVE_JSON_PHONES : MAX_JSON_PHONES;
    if (phones.length > maxPhones) {
      toast.error(
        `Type at most ${maxPhones} numbers here. Use Excel import for larger lists.`
      );
      return;
    }

    if (textareaMode === "remove") {
      setPendingDelete({ kind: "typed-remove", phones });
      return;
    }

    if (textareaMode === "replace") {
      setPendingDelete({ kind: "typed-replace", phones });
      return;
    }

    const csvContent = `phone\n${phones.join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const csvFile = new File([blob], "phones.csv", { type: "text/csv" });

    importAccess(
      {
        id: botId,
        payload: {
          file: csvFile,
          mode: textareaMode,
          enabled: localEnabled || undefined,
        },
      },
      {
        onSuccess: ({ bot }) => {
          applyBot(bot);
          setPhonesRaw("");
        },
      }
    );
  };

  const pickFile = (next: File | null) => {
    if (!next) {
      setFile(null);
      return;
    }
    if (isLegacyXls(next.name)) {
      toast.error("Save as .xlsx or CSV and upload again.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (!isAllowedFile(next.name)) {
      toast.error("Upload an .xlsx, .xlsm, .csv, or .txt file.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (next.size > MAX_FILE_BYTES) {
      toast.error("File must be 5 MB or smaller.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(next);
  };

  const handleImport = () => {
    if (!file) {
      toast.error("Choose an Excel or CSV file first.");
      return;
    }
    if (fileMode === "remove") {
      setPendingDelete({ kind: "file-remove" });
      return;
    }
    if (fileMode === "replace") {
      setPendingDelete({ kind: "file-replace" });
      return;
    }
    runFileImport();
  };

  const runFileImport = (mode: TelegramAccessImportMode = fileMode) => {
    if (!file) return;
    importAccess(
      {
        id: botId,
        payload: {
          file,
          mode,
          enabled: mode === "remove" ? undefined : localEnabled || undefined,
        },
      },
      {
        onSuccess: ({ bot }) => {
          applyBot(bot);
          setFile(null);
          setPendingDelete(null);
          if (fileRef.current) fileRef.current.value = "";
        },
      }
    );
  };

  const runTypedImport = (phones: string[], mode: TelegramAccessImportMode) => {
    const csvContent = `phone\n${phones.join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const csvFile = new File([blob], "phones.csv", { type: "text/csv" });
    importAccess(
      {
        id: botId,
        payload: {
          file: csvFile,
          mode,
          enabled: localEnabled || undefined,
        },
      },
      {
        onSuccess: ({ bot }) => {
          applyBot(bot);
          setPhonesRaw("");
          setPendingDelete(null);
        },
      }
    );
  };

  const confirmPendingDelete = () => {
    if (!pendingDelete) return;
    switch (pendingDelete.kind) {
      case "chip":
        removePhones(
          { id: botId, payload: { ids: [pendingDelete.chip.id] }, last4: pendingDelete.chip.last4 },
          {
            onSuccess: ({ bot }) => {
              applyBot(bot);
              setPendingDelete(null);
            },
          }
        );
        return;
      case "typed-remove":
        removePhones(
          { id: botId, payload: { phones: pendingDelete.phones } },
          {
            onSuccess: ({ bot }) => {
              applyBot(bot);
              setPhonesRaw("");
              setPendingDelete(null);
            },
          }
        );
        return;
      case "typed-replace":
        runTypedImport(pendingDelete.phones, "replace");
        return;
      case "file-remove":
        runFileImport("remove");
        return;
      case "file-replace":
        runFileImport("replace");
        return;
      case "bulk":
        removePhones(
          { id: botId, payload: { ids: pendingDelete.ids } },
          {
            onSuccess: ({ bot }) => {
              applyBot(bot);
              setPendingDelete(null);
            },
          }
        );
        return;
      case "clear":
        updateAccess(
          { id: botId, payload: { phones: [], enabled: false } },
          {
            onSuccess: (bot) => {
              applyBot(bot);
              setLocalEnabled(false);
              setPhonesRaw("");
              setPendingDelete(null);
              setSelected(new Set());
              setListOpen(false);
              toast.success("Allowlist cleared");
            },
          }
        );
        return;
    }
  };

  const phones = access.allowed_phones;
  const lastPage = Math.max(1, Math.ceil(phones.length / PAGE_SIZE));
  const safePage = Math.min(page, lastPage);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return phones.slice(start, start + PAGE_SIZE);
  }, [phones, safePage]);
  const pageIds = pageRows.map((p) => p.id).filter(Boolean);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected = pageIds.some((id) => selected.has(id));
  const from = phones.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, phones.length);

  useEffect(() => {
    const el = chipRowRef.current;
    if (!el) return;
    const check = () => {
      const next = el.scrollWidth > el.clientWidth + 1;
      setChipsOverflow((prev) => (prev === next ? prev : next));
    };
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const id = requestAnimationFrame(check);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [phones]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Restrict by phone</p>
          <p className="text-xs text-muted-foreground">
            {localEnabled || access.enabled
              ? "Visitors must share a listed contact before chatting."
              : "Anyone who can find the bot can chat."}
          </p>
        </div>
        <Switch checked={localEnabled} onCheckedChange={handleToggle} disabled={busy} />
      </div>

      {localEnabled && access.allowed_count === 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          Upload a phone list or add at least one number. Restriction stays off until the list has
          numbers.
        </p>
      )}

      <div className="rounded-xl border bg-muted/10 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold">Allowlist</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {access.allowed_count === 0
                ? "No numbers on the list yet."
                : `${access.allowed_count} ${access.allowed_count === 1 ? "number" : "numbers"} on the list.`}{" "}
              We don’t store full numbers. Type the number or upload a remove file to drop one.
            </p>
          </div>
          {access.allowed_count > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              title="View all numbers"
              onClick={() => {
                setPage(1);
                setListOpen(true);
              }}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="sr-only">View all numbers</span>
            </Button>
          )}
        </div>
        {access.allowed_count > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <div ref={chipRowRef} className="flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-hidden">
              {phones.map((p, i) => (
                <span
                  key={p.id || `${p.last4}-${i}`}
                  title={p.last4 ? `Ending in ${p.last4}` : "Unknown"}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-2 py-1 font-mono text-[11px]"
                >
                  ••••{p.last4 ?? "????"}
                </span>
              ))}
            </div>
            {chipsOverflow && (
              <span className="shrink-0 text-xs tracking-widest text-muted-foreground">…</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-xl border px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Upload Excel or CSV</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Primary path for staff lists. Up to 2000 unique numbers. Format the phone column as
              Text in Excel.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5" />
            Template
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setFileMode("replace")}
            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              fileMode === "replace"
                ? "border-primary bg-primary/8"
                : "border-border/60 bg-muted/20 hover:border-border"
            }`}
          >
            <p className="font-medium">Replace list</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">File becomes the full allowlist.</p>
          </button>
          <button
            type="button"
            onClick={() => setFileMode("merge")}
            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              fileMode === "merge"
                ? "border-primary bg-primary/8"
                : "border-border/60 bg-muted/20 hover:border-border"
            }`}
          >
            <p className="font-medium">Add to existing list</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">New numbers are added; current people stay.</p>
          </button>
          <button
            type="button"
            onClick={() => setFileMode("remove")}
            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              fileMode === "remove"
                ? "border-primary bg-primary/8"
                : "border-border/60 bg-muted/20 hover:border-border"
            }`}
          >
            <p className="font-medium">Remove from list</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Drop matching numbers. Others stay.</p>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xlsm,.csv,.txt"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {file ? file.name : "Choose file"}
          </Button>
          <Button type="button" className="gap-2" disabled={busy || !file} onClick={handleImport}>
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {fileMode === "remove" ? "Remove numbers" : fileMode === "merge" ? "Add numbers" : "Upload list"}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Use a <code className="rounded bg-muted px-1 font-mono">phone</code> header, or put numbers
          in column A. <code className="rounded bg-muted px-1 font-mono">.xls</code> is not
          accepted — save as .xlsx or CSV.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border px-4 py-4">
        <div>
          <p className="text-sm font-medium">Type a few numbers</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            One per line or comma-separated. Ethiopian numbers in 09… or 07… form are accepted.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setTextareaMode("merge")}
            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              textareaMode === "merge"
                ? "border-primary bg-primary/8"
                : "border-border/60 bg-muted/20 hover:border-border"
            }`}
          >
            <p className="font-medium">Add to existing list</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Numbers are merged in; current entries stay.</p>
          </button>
          <button
            type="button"
            onClick={() => setTextareaMode("replace")}
            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              textareaMode === "replace"
                ? "border-primary bg-primary/8"
                : "border-border/60 bg-muted/20 hover:border-border"
            }`}
          >
            <p className="font-medium">Replace entire list</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Only these numbers will be allowed.</p>
          </button>
          <button
            type="button"
            onClick={() => setTextareaMode("remove")}
            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              textareaMode === "remove"
                ? "border-primary bg-primary/8"
                : "border-border/60 bg-muted/20 hover:border-border"
            }`}
          >
            <p className="font-medium">Remove from list</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Type the full number to drop it.</p>
          </button>
        </div>

        <Textarea
          value={phonesRaw}
          onChange={(e) => setPhonesRaw(e.target.value)}
          placeholder={"0911223344\n0922334455\n+251933445566"}
          rows={4}
          className="resize-none font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          Max {textareaMode === "remove" ? MAX_REMOVE_JSON_PHONES : MAX_JSON_PHONES} numbers. Use
          Excel upload for larger lists.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="gap-2"
          disabled={busy || !phonesRaw.trim()}
          onClick={handleSavePhones}
        >
          {importing || removing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : textareaMode === "remove" ? (
            <Trash2 className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {textareaMode === "remove"
            ? "Remove numbers"
            : textareaMode === "merge"
              ? "Add numbers"
              : "Replace list"}
        </Button>
        {access.allowed_count > 0 && (
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() => setPendingDelete({ kind: "clear" })}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear allowlist
          </Button>
        )}
      </div>

      <div className="grid gap-4">
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
          Prompt / denied / button copy are saved with the main Save button.
        </p>
      </div>

      <Dialog open={listOpen} onOpenChange={(open) => !busy && setListOpen(open)}>
        <DialogContent className="sm:max-w-2xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>Allowlist</DialogTitle>
            <DialogDescription>
              {access.allowed_count} {access.allowed_count === 1 ? "number" : "numbers"}. Only last 4
              digits are shown.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {selected.size > 0
                ? `${selected.size} selected`
                : "Select numbers to remove them in bulk."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-destructive hover:text-destructive"
              disabled={busy || selected.size === 0}
              onClick={() => setPendingDelete({ kind: "bulk", ids: [...selected] })}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove selected
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        allPageSelected ? true : somePageSelected ? "indeterminate" : false
                      }
                      disabled={busy || pageIds.length === 0}
                      onCheckedChange={(checked) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (checked === true) {
                            pageIds.forEach((id) => next.add(id));
                          } else {
                            pageIds.forEach((id) => next.delete(id));
                          }
                          return next;
                        });
                      }}
                      aria-label="Select page"
                    />
                  </TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead className="w-16 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      No numbers on the list.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((p, i) => (
                    <TableRow key={p.id || `${p.last4}-${i}`} data-state={selected.has(p.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(p.id)}
                          disabled={busy || !p.id}
                          onCheckedChange={(checked) => {
                            if (!p.id) return;
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (checked === true) next.add(p.id);
                              else next.delete(p.id);
                              return next;
                            });
                          }}
                          aria-label={p.last4 ? `Select number ending in ${p.last4}` : "Select number"}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">••••{p.last4 ?? "????"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={busy || !p.id}
                          title="Remove this number"
                          onClick={() => setPendingDelete({ kind: "chip", chip: p })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {phones.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-border/40 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {from.toLocaleString()}–{to.toLocaleString()}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {phones.length.toLocaleString()}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Page {safePage} of {lastPage}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 border-border/60 p-0"
                      disabled={safePage <= 1}
                      onClick={() => setPage(safePage - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 border-border/60 p-0"
                      disabled={safePage >= lastPage}
                      onClick={() => setPage(safePage + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDelete != null} onOpenChange={(open) => !open && !busy && setPendingDelete(null)}>
        <DialogContent className="z-60">
          <DialogHeader>
            <DialogTitle>{pendingDelete ? deleteCopy(pendingDelete).title : "Confirm"}</DialogTitle>
            <DialogDescription>
              {pendingDelete ? deleteCopy(pendingDelete).description : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="gap-2" disabled={busy} onClick={confirmPendingDelete}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {pendingDelete ? deleteCopy(pendingDelete).confirm : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
