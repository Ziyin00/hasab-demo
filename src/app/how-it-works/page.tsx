import type { Metadata } from "next";
import { LandingFontProvider } from "@/features/landing/landingFonts";
import { HowItWorksPage } from "@/features/landing/components/HowItWorksPage";

export const metadata: Metadata = {
  title: "How it works — Hasab Chat",
  description:
    "Teach your assistant what you know, embed chat on your website, and meet people on Telegram — in English, Amharic, and Afaan Oromoo.",
};

export default function HowItWorksRoute() {
  return (
    <LandingFontProvider>
      <HowItWorksPage />
    </LandingFontProvider>
  );
}
