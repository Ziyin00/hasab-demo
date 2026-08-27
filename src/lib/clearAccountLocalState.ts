import { HASAB_API_KEY_STORAGE } from "@/features/api-key/hooks/useHasabApiKey";
import { WIDGET_CONFIG_STORAGE_KEY } from "@/features/widget/hooks/useLocalWidgetConfig";

/** Browser keys that belong to one logged-in account / chat session. */
const SESSION_STORAGE_KEYS = [
  HASAB_API_KEY_STORAGE,
  WIDGET_CONFIG_STORAGE_KEY,
  "hasab_visitor_session_id",
  "hasab_chat_history_id",
  "hasabChatLang",
] as const;

/** Clear account-scoped portal storage so the next login starts clean. */
export function clearAccountLocalState() {
  if (typeof window === "undefined") return;
  for (const key of SESSION_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}
