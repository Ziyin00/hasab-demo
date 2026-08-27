"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FEATURES = [
  "Web chat widget — embed in minutes, brandable UI",
  "Telegram bot — meet people where they already are",
  "Web voice-to-voice — Amharic & Afaan Oromo speech",
  "Human handoff when the conversation needs a person",
];

export default function Features3() {
  return (
    <section
      id="platform"
      className="w-full border-t border-[var(--lp-border)] bg-[var(--lp-parchment)] py-20 sm:py-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0 space-y-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--lp-secondary)] px-3 py-1 text-sm text-[var(--lp-muted-fg)]">
            <span className="h-2 w-2 rounded-full bg-primary-gradient" />
            Core platform
          </div>

          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-[var(--lp-ink)] sm:text-4xl lg:text-5xl">
            Three channels. One system of record.
          </h2>

          <p className="max-w-lg text-pretty leading-relaxed text-[var(--lp-muted-fg)]">
            Most teams end up with a website FAQ, a Telegram bot someone built,
            and a call centre script — all saying slightly different things.
            Hasab collapses them into one.
          </p>

          <div className="space-y-2">
            {FEATURES.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7C20D0]/10">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#7C20D0]" />
                </div>
                <p className="text-sm leading-relaxed text-[var(--lp-muted-fg)]">{item}</p>
              </div>
            ))}
          </div>

          <Button
            asChild
            className="rounded-full bg-primary-gradient px-6 text-white hover:opacity-90"
          >
            <a href="#demo">Book a demo</a>
          </Button>
        </div>

        <div className="relative flex justify-center rounded-xl bg-[var(--lp-secondary)] p-6 sm:p-8">
          <div className="relative flex w-full max-w-md flex-col gap-4 lg:h-[380px]">
            <Card className="w-full rounded-lg border-[var(--lp-border)] bg-[var(--lp-card)] p-0 shadow-sm lg:absolute lg:top-0 lg:left-0 lg:w-[260px]">
              <CardContent className="space-y-2 p-4">
                <div className="text-xs text-[var(--lp-muted-fg)]">Channel overview</div>
                <div className="text-2xl font-semibold text-[var(--lp-ink)]">
                  91.6<span className="text-sm text-[var(--lp-muted-fg)]">%</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="rounded-md bg-[#7C20D0]/15 px-2 py-0.5 text-[#7C20D0]">
                    Auto-resolved
                  </span>
                  <span className="rounded-md bg-[#D020C9]/15 px-2 py-0.5 text-[#D020C9]">
                    Live
                  </span>
                </div>
                <div className="space-y-1 text-xs text-[var(--lp-muted-fg)]">
                  <div>Conversations: 184,320</div>
                  <div>Languages: am · om · en</div>
                  <div>Knowledge base: shared</div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full rounded-lg border-[var(--lp-border)] bg-[var(--lp-card)] p-0 shadow-sm lg:absolute lg:top-28 lg:right-0 lg:z-10 lg:w-[240px]">
              <CardContent className="space-y-3 p-4">
                <div className="text-xs text-[var(--lp-muted-fg)]">Language mix</div>
                <div className="text-sm text-[var(--lp-muted-fg)]">
                  <span className="font-medium text-[var(--lp-ink)]">58% Amharic</span> this month
                </div>
                <div className="flex h-2 w-full gap-1">
                  <div className="w-[58%] rounded-full bg-[#7C20D0]" />
                  <div className="w-[27%] rounded-full bg-[#D020C9]" />
                  <div className="w-[15%] rounded-full bg-[#c084fc]" />
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-[var(--lp-muted-fg)]">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#7C20D0]" />
                    አማርኛ
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#D020C9]" />
                    Oromo
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#c084fc]" />
                    EN
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full rounded-lg border-[var(--lp-border)] bg-[var(--lp-card)] p-0 shadow-sm lg:absolute lg:bottom-8 lg:left-10 lg:w-[260px]">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--lp-ink)]">Knowledge health</span>
                  <span className="text-xs text-[var(--lp-muted-fg)]">Live</span>
                </div>
                <div className="text-sm text-[var(--lp-muted-fg)]">
                  <span className="font-medium text-[var(--lp-ink)]">
                    Same answer everywhere
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="rounded-md bg-[#7C20D0]/15 px-2 py-0.5 text-[#7C20D0]">
                    Versioned
                  </span>
                  <span className="rounded-md bg-[#D020C9]/15 px-2 py-0.5 text-[#D020C9]">
                    Curated
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
