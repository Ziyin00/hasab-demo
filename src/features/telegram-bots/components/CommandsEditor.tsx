"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  TelegramBotCommand,
  TelegramCommandResponseType,
} from "../types/telegram-bot.types";
import { normalizeCommandName } from "../utils/format";

interface CommandsEditorProps {
  commands: TelegramBotCommand[];
  onChange: (commands: TelegramBotCommand[]) => void;
}

export function CommandsEditor({ commands, onChange }: CommandsEditorProps) {
  const update = (index: number, patch: Partial<TelegramBotCommand>) => {
    onChange(
      commands.map((c, i) => {
        if (i !== index) return c;
        const next = { ...c, ...patch };
        if (patch.command != null) next.command = normalizeCommandName(patch.command);
        return next;
      })
    );
  };

  const remove = (index: number) => {
    onChange(commands.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([
      ...commands,
      { command: "", description: "", response_type: "text", response: "" },
    ]);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Bot commands</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Edit the full list, save, then sync to Telegram. Built-ins{" "}
          <code className="rounded bg-muted px-1 font-mono text-[10px]">/start</code>,{" "}
          <code className="rounded bg-muted px-1 font-mono text-[10px]">/help</code>,{" "}
          <code className="rounded bg-muted px-1 font-mono text-[10px]">/reset</code> always work.
        </p>
      </div>

      <div className="space-y-3">
        {commands.length === 0 && (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center text-xs text-muted-foreground">
            No custom commands yet. Add one below.
          </div>
        )}

        {commands.map((cmd, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border bg-muted/10 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Command {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Command</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    /
                  </span>
                  <Input
                    value={cmd.command}
                    onChange={(e) => update(index, { command: e.target.value })}
                    placeholder="hours"
                    className="pl-6 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Menu description</Label>
                <Input
                  value={cmd.description ?? ""}
                  onChange={(e) => update(index, { description: e.target.value })}
                  placeholder="Business hours"
                  className="text-sm"
                  maxLength={256}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Response type</Label>
                <Select
                  value={cmd.response_type ?? "text"}
                  onValueChange={(v) =>
                    update(index, { response_type: v as TelegramCommandResponseType })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Static text</SelectItem>
                    <SelectItem value="chat">Seed chat prompt</SelectItem>
                    <SelectItem value="web_app">Web App button</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">
                  {(cmd.response_type ?? "text") === "web_app"
                    ? "Button caption"
                    : (cmd.response_type ?? "text") === "chat"
                      ? "Prompt seed"
                      : "Reply text"}
                </Label>
                <Textarea
                  value={cmd.response ?? ""}
                  onChange={(e) => update(index, { response: e.target.value })}
                  rows={2}
                  className="resize-none text-sm"
                  placeholder={
                    (cmd.response_type ?? "text") === "chat"
                      ? "Ask about pricing"
                      : "We are open 9–5 EAT."
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={add}>
        <Plus className="h-3.5 w-3.5" />
        Add command
      </Button>
    </div>
  );
}
