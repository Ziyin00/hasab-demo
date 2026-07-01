import { apiClient } from "@/lib/api-client";
import type { WidgetConfig, WidgetKeys } from "../types/widget.types";

export const widgetApi = {
  getConfig: async (): Promise<WidgetConfig> => {
    const r = await apiClient.get("/widget");
    return r.data.data.widget ?? r.data.data;
  },

  updateConfig: async (config: Partial<WidgetConfig>): Promise<WidgetConfig> => {
    const r = await apiClient.put("/widget", config);
    return r.data.data.widget ?? r.data.data;
  },

  getKeys: async (): Promise<WidgetKeys> => {
    const r = await apiClient.get("/widget/keys");
    return r.data.data;
  },

  rotateAnthropicKey: async (key: string): Promise<void> => {
    await apiClient.put("/widget/keys/anthropic", { anthropic_key: key });
  },
};
