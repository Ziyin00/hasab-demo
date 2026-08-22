"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import { normalizeWidgetSettings } from "@/features/chatbot-widgets/utils/normalizeSettings";
import { normalizeUiLanguageCode } from "@/features/chatbot-widgets/utils/languageCodes";
import { ChatWidget } from "./ChatWidget";

/**
 * Floating chatbot bubble mounted on every dashboard page. Driven by the
 * first active widget from the chatbot-widgets CRUD list — falls back to the
 * legacy single-widget config (via ChatWidget's own defaults) when no widget
 * has been created yet.
 *
 * Mounted only after client hydration so auth/localStorage cannot diverge
 * from the SSR tree (which always sees authenticated=false).
 *
 * `key` remounts the widget when the logged-in account changes so theme,
 * messages, and session state cannot leak across users.
 */
export function GlobalChatWidget() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  const userId = useAuthStore((s) => s.user?.id);
  const authenticated = useAuthStore((s) => s.authenticated);
  const { data: widgets } = useChatbotWidgets();
  const widget = widgets?.find((w) => w.is_active) ?? widgets?.[0];

  if (!ready || !authenticated) return null;

  return (
    <ChatWidget
      key={userId ?? "anon"}
      theme={widget?.theme}
      settings={normalizeWidgetSettings(widget?.settings)}
      position={widget?.position}
      welcomeMessage={widget?.welcome_message}
      botNameOverride={widget?.settings?.title || undefined}
      defaultLanguage={normalizeUiLanguageCode(widget?.default_language ?? "en")}
    />
  );
}
