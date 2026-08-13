import { ChatbotWidgetsPage } from "@/features/chatbot-widgets/components/ChatbotWidgetsPage";
import { RequireOrgUser } from "@/components/auth/RequireAccess";

export const metadata = { title: "Widgets — Hasab AI" };

export default function Page() {
  return (
    <RequireOrgUser>
      <ChatbotWidgetsPage />
    </RequireOrgUser>
  );
}
