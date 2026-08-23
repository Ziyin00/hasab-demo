"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useChatbotWidgets } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";
import { normalizeWidgetSettings } from "@/features/chatbot-widgets/utils/normalizeSettings";
import { normalizeUiLanguageCode } from "@/features/chatbot-widgets/utils/languageCodes";
import { ChatWidget } from "./ChatWidget";

/**
 * Floating chatbot bubble mounted on dashboard pages.
 * Only shown when the account has at least one chatbot widget — no empty-state fallback.
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
  const { data: widgets, isLoading, isFetched } = useChatbotWidgets();
  const widget = widgets?.find((w) => w.is_active) ?? widgets?.[0];

  if (!ready || !authenticated) return null;
  // Wait for the list so we never flash a default bubble, then hide if empty.
  if (isLoading || !isFetched || !widget) return null;

  return (
    <ChatWidget
      key={userId ?? "anon"}
      theme={widget.theme}
      settings={normalizeWidgetSettings(widget.settings)}
      position={widget.position}
      welcomeMessage={widget.welcome_message}
      botNameOverride={widget.settings?.title || undefined}
      defaultLanguage={normalizeUiLanguageCode(widget.default_language ?? "en")}
    />
  );
}
