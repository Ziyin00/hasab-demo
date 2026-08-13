import { chatbotApiClient } from "@/lib/api-client";
import type {
  CreateTelegramBotPayload,
  TelegramBot,
  TelegramBotsListData,
  UpdateTelegramAccessPayload,
  UpdateTelegramBotPayload,
} from "../types/telegram-bot.types";

function appendJsonField(fd: FormData, key: string, value: unknown) {
  if (value === undefined) return;
  if (value === null) {
    fd.append(key, "");
    return;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    fd.append(key, String(value));
    return;
  }
  fd.append(key, JSON.stringify(value));
}

function toCreateFormData(payload: CreateTelegramBotPayload): FormData {
  const fd = new FormData();
  fd.append("bot_token", payload.bot_token);
  if (payload.mode) fd.append("mode", payload.mode);
  if (payload.welcome_message != null) fd.append("welcome_message", payload.welcome_message);
  if (payload.about != null) fd.append("about", payload.about);
  if (payload.default_language) fd.append("default_language", payload.default_language);
  if (payload.rate_limit_per_minute != null) {
    fd.append("rate_limit_per_minute", String(payload.rate_limit_per_minute));
  }
  if (payload.is_active != null) fd.append("is_active", payload.is_active ? "1" : "0");
  appendJsonField(fd, "chat_context_ids", payload.chat_context_ids);
  appendJsonField(fd, "rag_store_ids", payload.rag_store_ids);
  appendJsonField(fd, "allowed_phones", payload.allowed_phones);
  appendJsonField(fd, "settings", payload.settings);
  if (payload.profile_photo) fd.append("profile_photo", payload.profile_photo);
  return fd;
}

function toUpdateFormData(payload: UpdateTelegramBotPayload): FormData {
  const fd = new FormData();
  fd.append("_method", "PATCH");
  if (payload.bot_token) fd.append("bot_token", payload.bot_token);
  if (payload.name != null) fd.append("name", payload.name);
  if (payload.about !== undefined) fd.append("about", payload.about ?? "");
  if (payload.mode) fd.append("mode", payload.mode);
  if (payload.welcome_message !== undefined) {
    fd.append("welcome_message", payload.welcome_message ?? "");
  }
  if (payload.default_language) fd.append("default_language", payload.default_language);
  if (payload.rate_limit_per_minute != null) {
    fd.append("rate_limit_per_minute", String(payload.rate_limit_per_minute));
  }
  if (payload.is_active != null) fd.append("is_active", payload.is_active ? "1" : "0");
  if (payload.refresh_webhook != null) {
    fd.append("refresh_webhook", payload.refresh_webhook ? "1" : "0");
  }
  if (payload.sync_commands != null) {
    fd.append("sync_commands", payload.sync_commands ? "1" : "0");
  }
  if (payload.remove_profile_photo) fd.append("remove_profile_photo", "1");
  appendJsonField(fd, "chat_context_ids", payload.chat_context_ids);
  appendJsonField(fd, "rag_store_ids", payload.rag_store_ids);
  appendJsonField(fd, "allowed_phones", payload.allowed_phones);
  appendJsonField(fd, "settings", payload.settings);
  if (payload.profile_photo) fd.append("profile_photo", payload.profile_photo);
  return fd;
}

function needsMultipart(payload: CreateTelegramBotPayload | UpdateTelegramBotPayload): boolean {
  return !!(
    ("profile_photo" in payload && payload.profile_photo) ||
    ("remove_profile_photo" in payload && payload.remove_profile_photo)
  );
}

export const telegramBotApi = {
  list: async (): Promise<TelegramBotsListData> => {
    const r = await chatbotApiClient.get("/telegram-bots");
    const data = r.data.data;
    return {
      bots: data?.bots ?? (Array.isArray(data) ? data : []),
      pagination: data?.pagination ?? {
        current_page: 1,
        per_page: 15,
        total: data?.bots?.length ?? 0,
        last_page: 1,
      },
    };
  },

  get: async (id: number): Promise<TelegramBot> => {
    const r = await chatbotApiClient.get(`/telegram-bots/${id}`);
    return r.data.data?.bot ?? r.data.data;
  },

  create: async (payload: CreateTelegramBotPayload): Promise<TelegramBot> => {
    if (needsMultipart(payload) || payload.profile_photo) {
      const r = await chatbotApiClient.post("/telegram-bots", toCreateFormData(payload), {
        headers: { "Content-Type": undefined },
      });
      return r.data.data?.bot ?? r.data.data;
    }
    const { profile_photo: _photo, ...json } = payload;
    void _photo;
    const r = await chatbotApiClient.post("/telegram-bots", json);
    return r.data.data?.bot ?? r.data.data;
  },

  update: async (id: number, payload: UpdateTelegramBotPayload): Promise<TelegramBot> => {
    if (needsMultipart(payload)) {
      const r = await chatbotApiClient.post(`/telegram-bots/${id}`, toUpdateFormData(payload), {
        headers: { "Content-Type": undefined },
      });
      return r.data.data?.bot ?? r.data.data;
    }
    const { profile_photo: _photo, remove_profile_photo: _rm, ...json } = payload;
    void _photo;
    void _rm;
    const r = await chatbotApiClient.patch(`/telegram-bots/${id}`, json);
    return r.data.data?.bot ?? r.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await chatbotApiClient.delete(`/telegram-bots/${id}`);
  },

  refreshWebhook: async (id: number): Promise<TelegramBot> => {
    const r = await chatbotApiClient.post(`/telegram-bots/${id}/webhook/refresh`);
    return r.data.data?.bot ?? r.data.data;
  },

  syncCommands: async (id: number): Promise<TelegramBot> => {
    const r = await chatbotApiClient.post(`/telegram-bots/${id}/commands/sync`);
    return r.data.data?.bot ?? r.data.data;
  },

  updateAccess: async (
    id: number,
    payload: UpdateTelegramAccessPayload
  ): Promise<TelegramBot> => {
    const r = await chatbotApiClient.put(`/telegram-bots/${id}/access`, payload);
    return r.data.data?.bot ?? r.data.data;
  },
};
