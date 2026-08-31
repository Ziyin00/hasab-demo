"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Languages,
  Mic,
  Send,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/store/auth.store";
import HasabHero, {
  NavCta,
  ThemeToggleButton,
} from "@/features/landing/components/HasabHero";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { ContactForm } from "@/features/landing/components/ContactForm";
import { DashboardAnalyticsSlider } from "@/features/landing/components/DashboardAnalyticsSlider";
import { CompanySection } from "@/features/landing/components/CompanySection";
import {
  Reveal,
  RevealLeft,
  RevealScale,
  Stagger,
  StaggerItem,
} from "@/features/landing/components/LandingMotion";
import { cn } from "@/lib/utils";
import "./../landing.css";

const CONTACT_EMAIL = "contact@hasab.ai";
const DEMO_SUBJECT = "Hasab AI Chat demo request";

const CHANNELS = [
  {
    title: "Web chat widget",
    body: "A few lines of script on your existing site. Themed to your brand, works on mobile, and hands off to a person when it should.",
    icon: Globe,
    points: ["Embed in minutes", "Brandable UI", "Human handoff"],
  },
  {
    title: "Telegram bot",
            body: "Meet people where they already are. The same assistant, inside the messaging apps communities across Africa open every day.",
    icon: Send,
    points: ["Native Telegram UX", "Same knowledge base", "No app to install"],
  },
  {
    title: "Web voice-to-voice",
    body: "Real-time spoken conversation in the browser — for users who would rather speak than type.",
    icon: Mic,
    points: ["Low-latency speech", "Amharic & Afaan Oromo", "Browser-native"],
  },
];

const LANGUAGE_POINTS = [
  "Automatic per-message language detection",
  "Ge'ez script rendering and input handled properly",
  "Consistent terminology across all three languages",
  "New languages added on request",
];

const LANGUAGE_SAMPLES = [
  {
    code: "am",
    label: "Amharic",
    native: "አማርኛ",
    text: "ሰላም እንዴት ልረዳዎት?",
  },
  {
    code: "om",
    label: "Afaan Oromo",
    native: "Afaan Oromoo",
    text: "Akkam? Akkamittin si gargaaruu danda'a?",
  },
  {
    code: "en",
    label: "English",
    native: "English",
    text: "Hello. How can I help you today?",
  },
];

export function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const authenticated = useAuthStore((s) => s.authenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme !== "light";

  return (
    <div className="landing min-h-screen overflow-x-hidden bg-[var(--lp-parchment)] text-[var(--lp-ink)]">
      <HasabHero
        themeToggle={
          <ThemeToggleButton
            isDark={isDark}
            onToggle={() => setTheme(isDark ? "light" : "dark")}
          />
        }
        navExtra={<NavCta mounted={mounted} authenticated={authenticated} />}
      />

      {/* Platform — three channel cards */}
      <section id="platform" className="lp-section lp-platform-section border-b border-[var(--lp-border)]">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <Reveal className="max-w-2xl">
            <p className="lp-section-label">Core platform</p>
            <h2 className="mt-3 text-balance text-3xl tracking-tight sm:text-4xl lg:text-5xl">
              Three channels. One system of record.
            </h2>
            <p className="lp-prose mt-5 max-w-xl leading-relaxed text-[var(--lp-muted-fg)]">
              Most teams end up with a website FAQ, a Telegram bot someone built, and a call-centre
              script — all saying slightly different things. Hasab collapses them into one curated
              knowledge base.
            </p>
          </Reveal>

          <Stagger className="mt-14 grid gap-4 md:grid-cols-3">
            {CHANNELS.map((channel) => {
              const Icon = channel.icon;
              return (
                <StaggerItem key={channel.title}>
                  <article className="lp-channel-card flex h-full flex-col border p-6 sm:p-7">
                    <span className="lp-channel-icon flex size-11 items-center justify-center">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-medium tracking-tight text-[var(--lp-channel-fg)]">
                      {channel.title}
                    </h3>
                    <p className="lp-prose mt-3 flex-1 text-sm leading-relaxed text-[var(--lp-channel-muted)]">
                      {channel.body}
                    </p>
                    <ul className="mt-6 space-y-2 border-t border-[var(--lp-channel-border)] pt-5">
                      {channel.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-center gap-2.5 text-sm text-[var(--lp-channel-muted)]"
                        >
                          <span className="size-1.5 shrink-0 rounded-full bg-[var(--lp-brand)]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Languages */}
      <section id="languages" className="lp-section border-b border-[var(--lp-border)] bg-[var(--lp-secondary)]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <RevealLeft>
            <p className="lp-section-label">Languages</p>
            <h2 className="mt-3 text-balance text-3xl tracking-tight sm:text-4xl">
              Multilingual by design, not by translation layer.
            </h2>
            <p className="lp-prose mt-5 leading-relaxed text-[var(--lp-muted-fg)]">
              We build for Amharic and Afaan Oromo first — on the continent, with African language
              data — not as a locale bolted onto an English product. The assistant detects each message
              and replies in kind, including when a user switches mid-conversation.
            </p>
            <ul className="mt-8 space-y-3">
              {LANGUAGE_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-[var(--lp-ink)]">
                  <Languages className="mt-0.5 size-4 shrink-0 text-[var(--lp-brand)]" />
                  {point}
                </li>
              ))}
            </ul>
          </RevealLeft>

          <Stagger className="space-y-3">
            {LANGUAGE_SAMPLES.map((row) => (
              <StaggerItem key={row.code}>
                <div className="lp-lang-sample border border-[var(--lp-border)] bg-[var(--lp-card)] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[var(--lp-muted-fg)]">
                      <span className="size-1.5 rounded-full bg-[#22c55e]" />
                      detected · {row.label}
                      <span className="rounded bg-[var(--lp-secondary)] px-1.5 py-0.5 text-[10px] normal-case tracking-normal">
                        auto
                      </span>
                    </span>
                    <span className="text-xs font-medium text-[var(--lp-brand)]">
                      <span className={row.code === "am" ? "lp-fidel" : undefined}>{row.native}</span>
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-4 text-lg leading-relaxed text-[var(--lp-ink)] sm:text-xl",
                      row.code === "am" && "lp-fidel font-ethiopic"
                    )}
                  >
                    {row.text}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <DashboardAnalyticsSlider />

      <CompanySection />

      {/* Contact */}
      <section id="demo" className="lp-section">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <RevealLeft>
            <p className="lp-section-label">Contact</p>
            <h2 className="mt-3 text-balance text-3xl tracking-tight sm:text-4xl">
              Let&apos;s talk about your deployment.
            </h2>
            <p className="lp-prose mt-5 max-w-md leading-relaxed text-[var(--lp-muted-fg)]">
              Tell us the channels and languages you need. We&apos;ll show you a working system —
              and give you a straight answer on cost and timeline.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-8 inline-flex text-sm font-medium text-[var(--lp-brand)] underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </RevealLeft>

          <RevealScale delay={0.12}>
            <ContactForm
              defaultSubject={DEMO_SUBJECT}
              messageLabel="What would you like to solve?"
              messagePlaceholder="Channels, languages, expected volume, timeline…"
            />
          </RevealScale>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
