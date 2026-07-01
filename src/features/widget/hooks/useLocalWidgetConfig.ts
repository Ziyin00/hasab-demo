import { useState, useEffect } from "react";
import type { WidgetConfig } from "../types/widget.types";

export const WIDGET_CONFIG_STORAGE_KEY = "hasab-widget-config";

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  primary_color: "#3C6278",
  user_message_color: "#6F0001",
  position: "bottom-right",
  width: 460,
  height: 650,
  bot_name: "Hasab AI Chat",
  avatar_text: "HA",
  welcome_message: "Hello! How can I help you today?",
};

function readStorage(): WidgetConfig | null {
  try {
    const raw = localStorage.getItem(WIDGET_CONFIG_STORAGE_KEY);
    if (raw) return { ...DEFAULT_WIDGET_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return null;
}

export function writeWidgetConfigStorage(config: WidgetConfig): void {
  try {
    localStorage.setItem(WIDGET_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function useLocalWidgetConfig() {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_WIDGET_CONFIG);
  // ready: localStorage has been read (SSR-safe — never true on server)
  const [ready, setReady] = useState(false);
  // seeded: config came from localStorage or server (not just the compile-time default)
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const stored = readStorage();
    if (stored) {
      setConfig(stored);
      setSeeded(true);
    }
    setReady(true);
  }, []);

  const setField = <K extends keyof WidgetConfig>(key: K, val: WidgetConfig[K]) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: val };
      writeWidgetConfigStorage(next);
      return next;
    });
  };

  // Called when server config first arrives and localStorage is empty
  const seedFromServer = (serverConfig: WidgetConfig) => {
    if (seeded) return;
    const next = { ...DEFAULT_WIDGET_CONFIG, ...serverConfig };
    writeWidgetConfigStorage(next);
    setConfig(next);
    setSeeded(true);
  };

  return { config, setField, seedFromServer, ready, seeded };
}
