"use client";

import { useAuthStore } from "@/store/auth.store";
import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import { ChatWidget } from "./ChatWidget";

/**
 * Floating chatbot bubble mounted on every dashboard page. Driven by the
 * first active widget from the chatbot-widgets CRUD list — falls back to the
 * legacy single-widget config (via ChatWidget's own defaults) when no widget
 * has been created yet.
 *
 * `key` remounts the widget when the logged-in account changes so theme,
 * messages, and session state cannot leak across users.
 */
export function GlobalChatWidget() {
  const userId = useAuthStore((s) => s.user?.id);
  const authenticated = useAuthStore((s) => s.authenticated);
  const { data: widgets } = useChatbotWidgets();
  const widget = widgets?.find((w) => w.is_active) ?? widgets?.[0];

  if (!authenticated) return null;

  return (
    <ChatWidget
      key={userId ?? "anon"}
      theme={widget?.theme}
      settings={widget?.settings}
      position={widget?.position}
      welcomeMessage={widget?.welcome_message}
      botNameOverride={widget?.settings.title || undefined}
      defaultLanguage={widget?.default_language}
    />
  );
}
