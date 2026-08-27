import { WidgetFormPage } from "@/features/chatbot-widgets/components/WidgetFormPage";
import { RequireOrgUser } from "@/components/auth/RequireAccess";

export default function NewWidgetPage() {
  return (
    <RequireOrgUser>
      <WidgetFormPage />
    </RequireOrgUser>
  );
}
