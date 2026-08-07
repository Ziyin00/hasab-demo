import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { telegramBotApi } from "../api/telegram-bot.api";
import type {
  CreateTelegramBotPayload,
  UpdateTelegramAccessPayload,
  UpdateTelegramBotPayload,
} from "../types/telegram-bot.types";

const BOTS_KEY = ["telegram-bots"] as const;

function errMessage(err: AxiosError<{ message?: string }>, fallback: string) {
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
      toast.success("Telegram bot created");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(errMessage(err, "Failed to create bot"));
    },
  });
}

export function useUpdateTelegramBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTelegramBotPayload }) =>
      telegramBotApi.update(id, payload),
    onSuccess: (bot) => {
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
      toast.success("Access list updated");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(errMessage(err, "Failed to update access"));
    },
  });
}
