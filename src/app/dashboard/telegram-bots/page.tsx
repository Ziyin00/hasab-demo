import { TelegramBotsPage } from "@/features/telegram-bots/components/TelegramBotsPage";
import { RequireOrgUser } from "@/components/auth/RequireAccess";

export const metadata = { title: "Telegram Bots — Hasab AI" };

export default function Page() {
  return (
    <RequireOrgUser>
      <TelegramBotsPage />
    </RequireOrgUser>
  );
}
