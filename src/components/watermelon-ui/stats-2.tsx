"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bolt, Rocket, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const stats: {
  icon: LucideIcon;
  pillBg: string;
  pillText: string;
  glowColor: string;
  accentGradient: string;
  label: string;
  metric: string;
  subLabel: string;
  description: string;
}[] = [
  {
    icon: Bolt,
    pillBg: "bg-[#7C20D0]/10",
    pillText: "text-[#7C20D0]",
    glowColor: "rgba(124,32,208,0.18)",
    accentGradient: "from-[#7C20D0] via-[#A020D0] to-[#D020C9]",
    label: "Monthly active users",
    metric: "19k+",
    subLabel: "Live national platform",
    description:
      "Citizens and staff already talk to Hasab every day — across web chat, Telegram, and voice.",
  },
  {
    icon: Rocket,
    pillBg: "bg-[#D020C9]/10",
    pillText: "text-[#D020C9]",
    glowColor: "rgba(208,32,201,0.18)",
    accentGradient: "from-[#D020C9] via-[#9B20D0] to-[#7C20D0]",
    label: "Languages served natively",
    metric: "3",
    subLabel: "Detected automatically",
    description:
      "Amharic, Afaan Oromo, and English — built first-class, not bolted on as translation locales.",
  },
  {
    icon: Shield,
    pillBg: "bg-[#7C20D0]/10",
    pillText: "text-[#5A1899] dark:text-[#c084fc]",
    glowColor: "rgba(124,32,208,0.15)",
    accentGradient: "from-[#7C20D0] via-[#8B20D0] to-[#5A1899]",
    label: "One knowledge base",
    metric: "1",
    subLabel: "Every channel",
    description:
      "Approve an answer once. Web, Telegram, and voice all read the same curated source of truth.",
  },
];

export default function Stats2() {
  return (
    <section className="w-full border-t border-[var(--lp-border)] bg-[var(--lp-parchment)] px-4 py-20 sm:px-6 md:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight text-[var(--lp-ink)] sm:text-4xl md:text-5xl">
          Proven where it{" "}
          <span className="bg-clip-text text-transparent bg-primary-gradient">matters most</span>
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-[var(--lp-muted-fg)] md:text-lg">
          One conversational AI across every channel Ethiopian institutions already use — with
          numbers from a live national deployment.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="lp-stat-card group relative overflow-hidden rounded-xl border-[var(--lp-border)] bg-[var(--lp-card)] p-0 shadow-none"
            >
              <div
                className="lp-stat-glow pointer-events-none absolute inset-0 opacity-0"
                style={{
                  background: `radial-gradient(600px circle at 50% 0%, ${stat.glowColor}, transparent 60%)`,
                }}
              />

              <div
                className={`lp-stat-accent absolute top-[20%] left-0 h-[60%] w-[3px] rounded-full bg-gradient-to-b ${stat.accentGradient}`}
              />

              <CardContent className="relative flex h-full flex-col p-6 text-left sm:p-7">
                <span
                  className={`lp-stat-pill inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide uppercase ${stat.pillBg} ${stat.pillText}`}
                >
                  <stat.icon className="lp-stat-icon size-3" />
                  {stat.label}
                </span>

                <div className="mt-6 text-5xl font-bold tracking-tighter text-[var(--lp-ink)] sm:text-6xl">
                  {stat.metric}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div
                    className={`lp-stat-shimmer h-[2px] w-8 rounded-full bg-gradient-to-r ${stat.accentGradient}`}
                  />
                  <p className="text-sm font-medium text-[var(--lp-ink)]">{stat.subLabel}</p>
                </div>

                <p className="lp-stat-desc mt-5 text-sm leading-relaxed text-[var(--lp-muted-fg)]">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
