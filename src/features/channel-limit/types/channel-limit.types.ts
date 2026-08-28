export interface ChatChannelLimit {
  limit: number;
  used: number;
  remaining: number;
  widgets: number;
  telegram_bots: number;
  uses_default_limit?: boolean;
  default_limit?: number;
}

export interface ChatChannelLimitResponse {
  chat_channel_limit: ChatChannelLimit;
}
