import { TelegramBotFormPage } from "@/features/telegram-bots/components/TelegramBotFormPage";
import { RequireOrgUser } from "@/components/auth/RequireAccess";

export const metadata = { title: "New Telegram Bot — Hasab AI" };

export default function NewTelegramBotPage() {
  return (
    <RequireOrgUser>
      <TelegramBotFormPage />
    </RequireOrgUser>
  );
}
