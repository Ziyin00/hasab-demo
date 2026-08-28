import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { CHANNEL_LIMIT_KEY } from "@/features/channel-limit/hooks/useChannelLimit";
import { channelLimitErrorMessage } from "@/features/channel-limit/utils/limitErrors";
import { telegramBotApi } from "../api/telegram-bot.api";
import type {
  CreateTelegramBotPayload,
  ImportTelegramAccessPayload,
  RemoveTelegramAccessPayload,
  UpdateTelegramAccessPayload,
  UpdateTelegramBotPayload,
} from "../types/telegram-bot.types";

const BOTS_KEY = ["telegram-bots"] as const;

function errMessage(
  err: AxiosError<{ message?: string; errors?: Record<string, string[] | string> }>,
  fallback: string
) {
  const errors = err.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors).flatMap((v) => (Array.isArray(v) ? v : [v]))[0];
    if (first) return first;
  }
  return err.response?.data?.message ?? fallback;
}

export function useTelegramBots() {
  return useQuery({
    queryKey: BOTS_KEY,
    queryFn: telegramBotApi.list,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTelegramBot(id: number) {
  return useQuery({
    queryKey: ["telegram-bot", id],
    queryFn: () => telegramBotApi.get(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTelegramBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTelegramBotPayload) => telegramBotApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOTS_KEY });
      queryClient.invalidateQueries({ queryKey: CHANNEL_LIMIT_KEY });
      toast.success("Telegram bot created");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(channelLimitErrorMessage(err, errMessage(err, "Failed to create bot")));
    },
  });
}

export function useUpdateTelegramBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTelegramBotPayload }) =>
      telegramBotApi.update(id, payload),
    onSuccess: (bot) => {
      queryClient.setQueryData(["telegram-bot", bot.id], bot);
      queryClient.invalidateQueries({ queryKey: BOTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["telegram-bot", bot.id] });
      toast.success("Bot saved");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(errMessage(err, "Failed to save bot"));
    },
  });
}

export function useDeleteTelegramBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => telegramBotApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOTS_KEY });
      queryClient.invalidateQueries({ queryKey: CHANNEL_LIMIT_KEY });
      toast.success("Bot deleted");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(errMessage(err, "Failed to delete bot"));
    },
  });
}

export function useRefreshTelegramWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => telegramBotApi.refreshWebhook(id),
    onSuccess: (bot) => {
      queryClient.invalidateQueries({ queryKey: BOTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["telegram-bot", bot.id] });
      toast.success("Webhook refreshed");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(errMessage(err, "Failed to refresh webhook"));
    },
  });
}

export function useSyncTelegramCommands() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => telegramBotApi.syncCommands(id),
    onSuccess: (bot) => {
      queryClient.invalidateQueries({ queryKey: BOTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["telegram-bot", bot.id] });
      toast.success("Commands synced to Telegram");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(errMessage(err, "Failed to sync commands"));
    },
  });
}

export function useUpdateTelegramAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTelegramAccessPayload }) =>
      telegramBotApi.updateAccess(id, payload),
    onSuccess: (bot) => {
      queryClient.invalidateQueries({ queryKey: BOTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["telegram-bot", bot.id] });
    },
    onError: (err: AxiosError<{ message?: string; errors?: Record<string, string[] | string> }>) => {
      toast.error(errMessage(err, "Failed to update access"));
    },
  });
}

function toastAccessRemoved(removed: number, notFound: number, allowedCount: number, last4?: string | null) {
  if (allowedCount === 0) {
    toast.success("Allowlist is empty. Phone restriction was turned off.");
    return;
  }
  if (last4 && removed === 1 && notFound === 0) {
    toast.success(`Removed number ending in ${last4}.`);
    return;
  }
  if (notFound > 0) {
    toast.success(`Removed ${removed}. ${notFound} were not on the list.`);
    return;
  }
  toast.success(`Removed ${removed} number${removed === 1 ? "" : "s"}`);
}

export function useRemoveTelegramAccessPhones() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: RemoveTelegramAccessPayload;
      last4?: string | null;
    }) => telegramBotApi.removePhones(id, payload),
    onSuccess: ({ bot, removed, not_found, allowed_count }, variables) => {
      queryClient.invalidateQueries({ queryKey: BOTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["telegram-bot", bot.id] });
      toastAccessRemoved(removed, not_found, allowed_count, variables.last4);
    },
    onError: (err: AxiosError<{ message?: string; errors?: Record<string, string[] | string> }>) => {
      toast.error(errMessage(err, "Failed to remove phone"));
    },
  });
}

export function useImportTelegramAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ImportTelegramAccessPayload }) =>
      telegramBotApi.importAccess(id, payload),
    onSuccess: ({ bot, import: result }) => {
      queryClient.invalidateQueries({ queryKey: BOTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["telegram-bot", bot.id] });
      if (result?.mode === "remove") {
        toastAccessRemoved(result.removed ?? 0, result.not_found ?? 0, result.allowed_count ?? 0);
        return;
      }
      const imported = result?.imported ?? 0;
      const skipped = result?.invalid ?? 0;
      toast.success(
        skipped > 0
          ? `Imported ${imported} numbers. ${skipped} rows skipped.`
          : `Imported ${imported} phone numbers`
      );
    },
    onError: (err: AxiosError<{ message?: string; errors?: Record<string, string[] | string> }>) => {
      toast.error(errMessage(err, "Failed to import allowlist"));
    },
  });
}
