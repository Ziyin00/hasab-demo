export type TelegramBotMode = "chat" | "mini_app" | "hybrid";

export type TelegramCommandResponseType = "text" | "web_app" | "chat";

export interface TelegramBotCommand {
  command: string;
  description?: string;
  response_type?: TelegramCommandResponseType;
  response?: string;
}

export interface TelegramAccessControl {
  enabled: boolean;
  mode: string;
  prompt_message?: string | null;
  denied_message?: string | null;
  share_button_text?: string | null;
  allowed_phones: { last4: string | null }[];
  allowed_count: number;
}

export interface TelegramMiniAppSettings {
  enabled: boolean;
  url: string | null;
  button_text?: string;
}

export interface TelegramBotFeatures {
  voice: boolean;
  chat: boolean;
}

export interface TelegramBotSettings {
  commands: TelegramBotCommand[];
  access_control: TelegramAccessControl;
  mini_app: TelegramMiniAppSettings;
  features: TelegramBotFeatures;
}

export interface TelegramBot {
  id: number;
  public_id: string;
  name: string;
  bot_username: string | null;
  bot_id: number | null;
  bot_token_masked: string;
  mode: TelegramBotMode;
  chat_context_ids: number[];
  rag_store_ids: number[];
  welcome_message: string | null;
  about: string | null;
  default_language: string;
  settings: TelegramBotSettings;
  rate_limit_per_minute: number;
  is_active: boolean;
  last_webhook_at: string | null;
  telegram_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TelegramBotsPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface TelegramBotsListData {
  bots: TelegramBot[];
  pagination: TelegramBotsPagination;
}

export interface CreateTelegramBotPayload {
  bot_token: string;
  mode?: TelegramBotMode;
  welcome_message?: string | null;
  about?: string | null;
  default_language?: string;
  chat_context_ids?: number[];
  rag_store_ids?: number[];
  allowed_phones?: string[];
  settings?: Partial<{
    commands: TelegramBotCommand[];
    access_control: Partial<TelegramAccessControl>;
    mini_app: Partial<TelegramMiniAppSettings>;
    features: Partial<TelegramBotFeatures>;
  }>;
  rate_limit_per_minute?: number;
  is_active?: boolean;
  profile_photo?: File | null;
}

export interface UpdateTelegramBotPayload {
  bot_token?: string;
  name?: string;
  about?: string | null;
  mode?: TelegramBotMode;
  welcome_message?: string | null;
  default_language?: string;
  chat_context_ids?: number[];
  rag_store_ids?: number[];
  allowed_phones?: string[];
  settings?: Partial<{
    commands: TelegramBotCommand[];
    access_control: Partial<Omit<TelegramAccessControl, "allowed_phones" | "allowed_count">>;
    mini_app: Partial<TelegramMiniAppSettings>;
    features: Partial<TelegramBotFeatures>;
  }>;
  rate_limit_per_minute?: number;
  is_active?: boolean;
  refresh_webhook?: boolean;
  sync_commands?: boolean;
  profile_photo?: File | null;
  remove_profile_photo?: boolean;
}

export interface UpdateTelegramAccessPayload {
  phones?: string[];
  enabled?: boolean;
}

export const DEFAULT_TELEGRAM_SETTINGS: TelegramBotSettings = {
  commands: [
    { command: "start", description: "Start" },
    { command: "help", description: "Help" },
  ],
  access_control: {
    enabled: false,
    mode: "phone_allowlist",
    prompt_message: "Share your phone number to continue.",
    denied_message: "You are not authorized to use this bot.",
    share_button_text: "Share phone number",
    allowed_phones: [],
    allowed_count: 0,
  },
  mini_app: {
    enabled: false,
    url: null,
    button_text: "Open chat",
  },
  features: {
    chat: true,
    voice: false,
  },
};
