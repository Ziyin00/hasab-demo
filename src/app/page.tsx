import type { Metadata } from "next";
import { LandingFontProvider } from "@/features/landing/landingFonts";
import { LandingPage } from "@/features/landing/components/LandingPage";

export const metadata: Metadata = {
  title: "Hasab AI Chat — One AI platform, every channel, every language",
  description:
    "Deploy one conversational AI across web chat, Telegram and real-time voice — native Amharic, Afaan Oromo and English, on a single approved knowledge base. Built in Addis Ababa.",
};

export default function RootPage() {
  return (
    <LandingFontProvider>
      <LandingPage />
    </LandingFontProvider>
  );
}
