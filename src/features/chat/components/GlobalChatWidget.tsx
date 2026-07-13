"use client";

import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import { ChatWidget } from "./ChatWidget";

/**
 * Floating chatbot bubble mounted on every dashboard page. Driven by the
 * first active widget from the chatbot-widgets CRUD list — falls back to the
 * legacy single-widget config (via ChatWidget's own defaults) when no widget
 * has been created yet.
 */
export function GlobalChatWidget() {
  const { data: widgets } = useChatbotWidgets();
  const widget = widgets?.find((w) => w.is_active) ?? widgets?.[0];

  return (
    <ChatWidget
      theme={widget?.theme}
      settings={widget?.settings}
      position={widget?.position}
      welcomeMessage={widget?.welcome_message}
      botNameOverride={widget ? (widget.settings.title || widget.name) : undefined}
    />
  );
}
