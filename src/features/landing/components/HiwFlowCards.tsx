"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Globe, Send } from "lucide-react";
import { motion } from "motion/react";
import { Reveal } from "@/features/landing/components/LandingMotion";
import { cardHover, staggerContainer, staggerItem, viewportOnce } from "@/features/landing/motion";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: "01",
    title: "Teach it what you know",
    tag: "Contexts",
    icon: BookOpen,
    accent: "text-[#7C20D0]",
    chipBg: "bg-[#7C20D0]/12 text-[#7C20D0]",
    mock: "context",
  },
  {
    step: "02",
    title: "Put chat on your site",
    tag: "Website widget",
    icon: Globe,
    accent: "text-[#D020C9]",
    chipBg: "bg-[#D020C9]/12 text-[#D020C9]",
    mock: "widget",
  },
  {
    step: "03",
    title: "Meet people on Telegram",
    tag: "Telegram bot",
    icon: Send,
    accent: "text-[#5A1899]",
    chipBg: "bg-[#5A1899]/12 text-[#5A1899]",
    mock: "telegram",
  },
] as const;

function GlassIcon({ icon: Icon, className }: { icon: typeof BookOpen; className?: string }) {
  return (
    <motion.div
      className="lp-hiw-glass-icon mb-4 size-fit rounded-xl p-px"
      whileHover={{ scale: 1.06, rotate: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-[calc(0.75rem-1px)] bg-[var(--lp-card)]",
          className
        )}
      >
        <Icon className="size-5" />
      </div>
    </motion.div>
  );
}

function ContextMock() {
  return (
    <motion.div
      className="mt-auto space-y-2 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-parchment)] p-3"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
    >
      <motion.div className="flex items-center gap-2" variants={staggerItem}>
        <span className="size-2 rounded-full bg-[#7C20D0]" />
        <span className="text-[10px] font-medium text-[var(--lp-ink)]">Company FAQ</span>
      </motion.div>
      <div className="space-y-1.5">
        {[100, 88, 72].map((w) => (
          <motion.div
            key={w}
            variants={staggerItem}
            className="h-1.5 rounded-full bg-[color-mix(in_oklab,var(--lp-ink)_8%,transparent)]"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
      <motion.div className="flex gap-1.5 pt-1" variants={staggerItem}>
        <span className="rounded-md bg-[#7C20D0]/10 px-2 py-0.5 text-[9px] font-medium text-[#7C20D0]">
          Identity
        </span>
        <span className="rounded-md bg-[#D020C9]/10 px-2 py-0.5 text-[9px] font-medium text-[#D020C9]">
          Tone
        </span>
      </motion.div>
    </motion.div>
  );
}

function WidgetMock() {
  return (
    <motion.div
      className="mt-auto overflow-hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-card)] shadow-sm"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
    >
      <motion.div
        variants={staggerItem}
        className="flex items-center gap-2 border-b border-[var(--lp-border)] bg-primary-gradient px-3 py-2"
      >
        <span className="size-2 rounded-full bg-white/80" />
        <span className="text-[10px] font-medium text-white">Hasab Assistant</span>
      </motion.div>
      <div className="space-y-2 p-3">
        <motion.div
          variants={staggerItem}
          className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-[#7C20D0]/10 px-2.5 py-1.5 text-[9px] text-[var(--lp-ink)]"
        >
          What are your hours?
        </motion.div>
        <motion.div
          variants={staggerItem}
          className="max-w-[90%] rounded-lg rounded-tl-sm bg-[var(--lp-secondary)] px-2.5 py-1.5 text-[9px] text-[var(--lp-muted-fg)]"
        >
          Mon–Fri, 9am–6pm EAT
        </motion.div>
        <motion.div variants={staggerItem} className="flex gap-1 pt-0.5">
          {["Hours", "Pricing", "Contact"].map((q) => (
            <span
              key={q}
              className="rounded-full border border-[var(--lp-border)] px-2 py-0.5 text-[8px] text-[var(--lp-muted-fg)]"
            >
              {q}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

function TelegramMock() {
  return (
    <motion.div
      className="mt-auto space-y-2 rounded-xl border border-[var(--lp-border)] bg-[#229ED9]/5 p-3"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
    >
      <motion.div className="flex items-center gap-2" variants={staggerItem}>
        <span className="flex size-6 items-center justify-center rounded-full bg-[#229ED9] text-[9px] font-bold text-white">
          H
        </span>
        <span className="text-[10px] font-medium text-[var(--lp-ink)]">Your Brand Bot</span>
      </motion.div>
      <div className="space-y-1.5">
        {[
          { align: "left", text: "ሰላም! How can I help?", cls: "max-w-[88%] rounded-lg rounded-tl-sm bg-[var(--lp-card)] px-2 py-1.5 text-[9px] shadow-sm" },
          { align: "right", text: "Delivery options?", cls: "ml-auto max-w-[80%] rounded-lg rounded-tr-sm bg-[#229ED9] px-2 py-1.5 text-[9px] text-white" },
          { align: "left", text: "Same answer as your website ✓", cls: "max-w-[92%] rounded-lg rounded-tl-sm bg-[var(--lp-card)] px-2 py-1.5 text-[9px] shadow-sm" },
        ].map((msg) => (
          <motion.div key={msg.text} variants={staggerItem} className={msg.cls}>
            {msg.text}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

const MOCKS = {
  context: ContextMock,
  widget: WidgetMock,
  telegram: TelegramMock,
};

export function HiwFlowCards() {
  return (
    <section className="lp-section border-b border-[var(--lp-border)]">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="lp-section-label">The flow</p>
          <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-4xl">
            From knowledge to live chat
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const Mock = MOCKS[step.mock];
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={viewportOnce}
                transition={{ duration: 0.65, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                whileHover={cardHover}
              >
                <Card className="lp-hiw-flow-card group h-full rounded-3xl border-[var(--lp-border)] bg-[var(--lp-secondary)] p-0 shadow-none ring-0">
                  <CardContent className="flex h-full min-h-[320px] flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <GlassIcon icon={Icon} className={step.accent} />
                      <span className="font-mono text-xs text-[var(--lp-muted-fg)]">{step.step}</span>
                    </div>
                    <h3 className="text-lg font-medium tracking-tight">{step.title}</h3>
                    <div className="mt-3">
                      <span
                        className={cn(
                          "inline-flex rounded-lg px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
                          step.chipBg
                        )}
                      >
                        {step.tag}
                      </span>
                    </div>
                    <Mock />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
