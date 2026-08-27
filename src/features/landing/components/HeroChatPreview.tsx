"use client";

import { useState } from "react";
import Image from "next/image";
import { Mic } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_SMOOTH } from "@/features/landing/motion";

type Lang = "am" | "en" | "om";

const LANG_DEMOS: Record<
  Lang,
  { label: string; native: string; user: string; bot: string }
> = {
  am: {
    label: "Amharic",
    native: "አማርኛ",
    user: "ማን ነህ? ምን ማድረግ ትችላለህ?",
    bot: "የ Hasab AI ረዳት ነኝ። ድረ-ገጽ ላይ ቻት፣ ቴሌግራም ቦት፣ እና የድምጽ አገልግሎቶችን ማዋቀር እችላለሁ።",
  },
  en: {
    label: "English",
    native: "English",
    user: "Who are you  and what can you do?",
    bot: "I'm the Hasab AI Assistant. I help you ship website widgets, Telegram bots, and speech  grounded in your knowledge.",
  },
  om: {
    label: "Afaan Oromoo",
    native: "Afaan Oromoo",
    user: "Eenyuu? Maal gochuu dandeessa?",
    bot: "Ani gargaaraa Hasab AI ti. Widget weebsaayitii, bot Telegram, fi sagalee  beekumsa kee irratti hundaa'ee  si gargaaruu nan danda'a.",
  },
};

export function HeroChatPreview() {
  const [lang, setLang] = useState<Lang>("en");
  const reduceMotion = useReducedMotion();
  const demo = LANG_DEMOS[lang];

  return (
    <div className="w-full max-w-md lg:max-w-none">
      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(LANG_DEMOS) as Lang[]).map((code) => (
          <button
            key={code}
            type="button"
            data-active={lang === code}
            className={cn(
              "lp-lang-pill rounded-full px-3.5 py-1.5 text-[12px] font-medium",
              "border border-[var(--lp-border)] text-[var(--lp-muted-fg)]",
              "transition-colors hover:text-[var(--lp-ink)]"
            )}
            onClick={() => setLang(code)}
          >
            {LANG_DEMOS[code].native}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-card)] shadow-[0_20px_50px_color-mix(in_oklab,var(--lp-brand)_10%,transparent)]">
        <div className="flex items-center gap-3 border-b border-[var(--lp-border)] px-5 py-4">
          <Image
            src="/hasab_ai.png"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--lp-ink)]">Hasab Assistant</p>
            <p className="text-[11px] text-[var(--lp-muted-fg)]">{demo.label} selected</p>
          </div>
          <span className="rounded-md bg-[color-mix(in_oklab,var(--lp-brand)_14%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--lp-brand)]">
            {demo.native}
          </span>
        </div>

        <div className="relative min-h-[180px] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={lang}
              className="space-y-3 px-5 py-5"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 14, filter: "blur(4px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, y: -10, filter: "blur(4px)" }
              }
              transition={{ duration: 0.4, ease: EASE_SMOOTH }}
            >
              <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-primary-gradient px-4 py-3 text-[13px] leading-relaxed text-white">
                {demo.user}
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-[var(--lp-border)] bg-[var(--lp-secondary)] px-4 py-3 text-[13px] leading-relaxed text-[var(--lp-ink)]">
                {demo.bot}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--lp-border)] px-4 py-3">
          <div className="h-10 flex-1 rounded-full border border-[var(--lp-border)] bg-[var(--lp-secondary)] px-4 text-[12px] leading-10 text-[var(--lp-muted-fg)]">
            Type a message…
          </div>
          <div
            className="flex size-10 items-center justify-center rounded-full bg-primary-gradient"
            aria-label="Voice record"
          >
            <Mic className="size-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
