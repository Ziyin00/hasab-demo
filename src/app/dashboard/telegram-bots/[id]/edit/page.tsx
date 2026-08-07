"use client";

import { use } from "react";
import { TelegramBotFormPage } from "@/features/telegram-bots/components/TelegramBotFormPage";
import { useTelegramBot } from "@/features/telegram-bots/hooks/useTelegramBots";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditTelegramBotPage({ params }: Props) {
  const { id } = use(params);
  const { data: bot, isLoading } = useTelegramBot(Number(id));

  return <TelegramBotFormPage bot={bot ?? null} loading={isLoading} />;
}
