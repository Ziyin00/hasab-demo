"use client";

import { use } from "react";
import { WidgetFormPage } from "@/features/chatbot-widgets/components/WidgetFormPage";
import { useChatbotWidget } from "@/features/chatbot-widgets/hooks/useChatbotWidgets";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditWidgetPage({ params }: Props) {
  const { id } = use(params);
  const { data: widget, isLoading } = useChatbotWidget(Number(id));

  return <WidgetFormPage widget={widget ?? null} loading={isLoading} />;
}
