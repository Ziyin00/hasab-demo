import { chatbotApiClient } from "@/lib/api-client";
import type { ChatChannelLimit } from "../types/channel-limit.types";

export const channelLimitApi = {
  get: async (): Promise<ChatChannelLimit> => {
    const r = await chatbotApiClient.get("/chat-platform/channel-limit");
    const payload = r.data.data?.chat_channel_limit ?? r.data.data;
    return payload as ChatChannelLimit;
  },
};
