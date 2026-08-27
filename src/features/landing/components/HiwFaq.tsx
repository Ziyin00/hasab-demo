"use client";

import { FaPlus } from "react-icons/fa6";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/features/landing/components/LandingMotion";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    id: "developer",
    q: "Do I need a developer?",
    a: "Add a small snippet for the widget; Telegram connects from the platform. Day-to-day edits happen in chat.hasab.ai.",
  },
  {
    id: "shared-knowledge",
    q: "Same knowledge on web and Telegram?",
    a: "Yes — build contexts once and attach them to both channels.",
  },
  {
    id: "languages",
    q: "Which languages are supported?",
    a: "English, Amharic, and Afaan Oromoo. Replies follow the language visitors choose.",
  },
  {
    id: "identity",
    q: "Will it say it's ChatGPT?",
    a: "Not when you set identity in context. It introduces itself with the name you choose.",
  },
];

export function HiwFaq() {
  return (
    <section className="border-b border-[var(--lp-border)] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        <Reveal className="mb-10 text-center">
          <p className="lp-section-label">FAQ</p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">
            Common questions
          </h2>
        </Reveal>

        <Accordion type="single" collapsible className="flex w-full flex-col gap-2">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              style={{ animationDelay: `${index * 90}ms` }}
              className={cn(
                "lp-faq-item overflow-hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-card)] px-5 not-last:border-b-0",
                "transition-colors duration-300 data-[state=open]:border-[color-mix(in_oklab,var(--lp-brand)_35%,var(--lp-border))]",
                "data-[state=open]:bg-[var(--lp-secondary)]"
              )}
            >
              <AccordionTrigger className="group flex items-center py-5 hover:no-underline [&_[data-slot=accordion-trigger-icon]]:!hidden">
                <span className="pr-4 text-left text-sm font-medium sm:text-base">{item.q}</span>
                <motion.span
                  className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--lp-secondary)] text-[var(--lp-muted-fg)] transition-colors group-data-[state=open]:bg-primary-gradient group-data-[state=open]:text-white"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <FaPlus className="size-3 transition-transform duration-200 group-data-[state=open]:rotate-45" />
                </motion.span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-[var(--lp-muted-fg)]">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
