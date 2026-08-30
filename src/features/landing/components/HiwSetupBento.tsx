"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Globe,
  Languages,
  Mic,
  Palette,
  Send,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { Reveal } from "@/features/landing/components/LandingMotion";
import { cardHover, viewportOnce } from "@/features/landing/motion";
import { cn } from "@/lib/utils";

type Tile = {
  id: string;
  label: string;
  icon: typeof BookOpen;
  className?: string;
  visual: ReactNode;
};

function SetupTile({ tile, delay }: { tile: Tile; delay: number }) {
  const Icon = tile.icon;
  return (
    <motion.div
      className={tile.className}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={cardHover}
    >
      <div className="group relative h-full rounded-2xl bg-gradient-to-br from-[color-mix(in_oklab,var(--lp-brand)_40%,transparent)] to-[color-mix(in_oklab,var(--lp-brand-hot)_20%,transparent)] p-px">
        <Card className="flex h-full flex-col overflow-hidden rounded-[calc(1rem-1px)] border-0 bg-[var(--lp-card)] p-0 shadow-none">
          <CardContent className="flex flex-1 flex-col p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--lp-brand)_10%,transparent)] text-[var(--lp-brand)]">
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-medium tracking-tight">{tile.label}</span>
            </div>
            {tile.visual}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function ContextVisual() {
  return (
    <div className="mt-auto space-y-2 rounded-lg bg-[var(--lp-secondary)] p-3">
      {["About us", "Shipping policy", "Support tone"].map((row, i) => (
        <div key={row} className="flex items-center gap-2">
          <span
            className={cn(
              "size-1.5 rounded-full",
              i === 0 ? "bg-[#7C20D0]" : "bg-[color-mix(in_oklab,var(--lp-ink)_20%,transparent)]"
            )}
          />
          <span className="text-[11px] text-[var(--lp-muted-fg)]">{row}</span>
        </div>
      ))}
    </div>
  );
}

function WidgetVisual() {
  return (
    <div className="mt-auto flex justify-end">
      <div className="w-[88%] overflow-hidden rounded-xl border border-[var(--lp-border)] shadow-md">
        <div className="h-1.5 bg-primary-gradient" />
        <div className="space-y-1.5 bg-[var(--lp-parchment)] p-2.5">
          <div className="h-6 w-6 rounded-full bg-primary-gradient opacity-90" />
          <div className="h-1.5 w-full rounded bg-[color-mix(in_oklab,var(--lp-ink)_6%,transparent)]" />
          <div className="h-1.5 w-2/3 rounded bg-[color-mix(in_oklab,var(--lp-ink)_4%,transparent)]" />
        </div>
      </div>
    </div>
  );
}

function TelegramVisual() {
  return (
    <div className="mt-auto flex gap-2">
      <div className="flex-1 rounded-lg bg-[#229ED9]/10 p-2 text-center">
        <Send className="mx-auto size-4 text-[#229ED9]" />
        <p className="mt-1 text-[9px] font-medium text-[#229ED9]">Connected</p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1 rounded-lg bg-[var(--lp-secondary)] p-2">
        <div className="h-1 w-full rounded bg-[color-mix(in_oklab,var(--lp-ink)_8%,transparent)]" />
        <div className="h-1 w-3/4 rounded bg-[color-mix(in_oklab,var(--lp-ink)_5%,transparent)]" />
      </div>
    </div>
  );
}

function LangVisual() {
  return (
    <div className="mt-auto flex flex-wrap gap-1.5">
      {[
        { label: "EN", color: "#c084fc" },
        { label: "አማ", color: "#7C20D0" },
        { label: "Om", color: "#D020C9" },
      ].map(({ label, color }) => (
        <span
          key={label}
          className="rounded-md px-2 py-1 text-[10px] font-semibold"
          style={{ background: `${color}18`, color }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function BrandVisual() {
  return (
    <div className="mt-auto flex items-end gap-2">
      <div className="flex gap-1">
        {["#7C20D0", "#D020C9", "#5A1899"].map((c) => (
          <span key={c} className="size-6 rounded-md" style={{ background: c }} />
        ))}
      </div>
      <div className="flex-1 rounded-lg bg-[var(--lp-secondary)] p-2">
        <div className="h-1.5 w-full rounded bg-primary-gradient" />
      </div>
    </div>
  );
}

const TILES: Tile[] = [
  { id: "context", label: "Contexts", icon: BookOpen, visual: <ContextVisual /> },
  { id: "widget", label: "Website widget", icon: Globe, visual: <WidgetVisual /> },
  { id: "telegram", label: "Telegram bot", icon: Send, visual: <TelegramVisual /> },
  {
    id: "lang",
    label: "Languages & prompts",
    icon: Languages,
    className: "lg:col-span-1",
    visual: <LangVisual />,
  },
  // {
  //   id: "brand",
  //   label: "Look & welcome",
  //   icon: Palette,
  //   className: "lg:col-span-1",
  //   visual: <BrandVisual />,
  // },
];

function VisitorPanel() {
  return (
    <motion.div
      className="sm:col-span-2 lg:col-span-2 lg:row-span-2 lg:col-start-3 lg:row-start-1"
      initial={{ opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="relative h-full min-h-[340px] rounded-2xl bg-gradient-to-br from-[var(--lp-brand)] via-[#D020C9] to-[var(--lp-brand-hot)] p-px">
        <Card className="flex h-full flex-col overflow-hidden rounded-[calc(1rem-1px)] border-0 bg-[var(--lp-card)] p-0 shadow-none">
          <CardContent className="relative flex h-full flex-col p-6 sm:p-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary-gradient opacity-15 blur-3xl"
            />
            <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-primary-gradient px-3 py-1 text-[0.65rem] font-semibold tracking-wide uppercase text-white">
              <Sparkles className="size-3.5" />
              Visitors get
            </span>

            <div className="relative mt-6 flex-1">
              <motion.div
                className="absolute inset-x-0 top-0 mx-auto max-w-[280px] overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-parchment)] shadow-lg"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center justify-between border-b border-[var(--lp-border)] px-4 py-2.5">
                  <span className="text-xs font-medium">Your Brand</span>
                  <motion.span
                    className="rounded-full bg-[#7C20D0]/12 px-2 py-0.5 text-[9px] font-medium text-[#7C20D0]"
                    animate={{ opacity: [1, 0.55, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Live
                  </motion.span>
                </div>
                <div className="space-y-2.5 p-4">
                  <div className="flex gap-2">
                    {["EN", "አማ", "Om"].map((l) => (
                      <span
                        key={l}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-medium",
                          l === "አማ"
                            ? "bg-primary-gradient text-white"
                            : "border border-[var(--lp-border)] text-[var(--lp-muted-fg)]"
                        )}
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="rounded-xl bg-[var(--lp-secondary)] p-3">
                    <p className="text-[11px] leading-relaxed text-[var(--lp-ink)]">
                      ሰላም! I&apos;m here to help with orders, hours, and support.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Track order", "Return policy", "Talk to us"].map((p) => (
                      <span
                        key={p}
                        className="rounded-full border border-[color-mix(in_oklab,var(--lp-brand)_25%,var(--lp-border))] px-2.5 py-1 text-[9px] text-[var(--lp-muted-fg)]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[var(--lp-border)] px-3 py-2">
                    <Mic className="size-3.5 text-[var(--lp-brand)]" />
                    <span className="text-[10px] text-[var(--lp-muted-fg)]">Type or speak…</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

export function HiwSetupBento() {
  return (
    <section className="lp-section border-b border-[var(--lp-border)] bg-[var(--lp-secondary)]">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="lp-section-label">Platform</p>
          <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-4xl">
            You configure once.{" "}
            <span className="bg-primary-gradient bg-clip-text text-transparent">
              They chat instantly.
            </span>
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {TILES.slice(0, 3).map((tile, i) => (
            <SetupTile key={tile.id} tile={tile} delay={i * 0.06} />
          ))}

          <VisitorPanel />

          {TILES.slice(3).map((tile, i) => (
            <SetupTile key={tile.id} tile={tile} delay={0.2 + i * 0.06} />
          ))}
        </div>
      </div>
    </section>
  );
}
