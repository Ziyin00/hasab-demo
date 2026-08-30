"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/store/auth.store";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import {
  NavCta,
  ThemeToggleButton,
} from "@/features/landing/components/HasabHero";
import { HiwFlowCards } from "@/features/landing/components/HiwFlowCards";
import { HiwSetupBento } from "@/features/landing/components/HiwSetupBento";
import { HiwFaq } from "@/features/landing/components/HiwFaq";
import { HeroReveal } from "@/features/landing/components/LandingMotion";
import Cta3 from "@/components/watermelon-ui/cta-3";
import {
  MdAutoAwesomeMosaic,
  MdBlurOn,
  MdDashboardCustomize,
  MdDonutSmall,
  MdHexagon,
  MdWaves,
} from "react-icons/md";
import "../landing.css";

const CTA_PRODUCTS = [
  { id: "context", name: "Contexts", icon: MdDonutSmall },
  { id: "web", name: "Web chat", icon: MdDashboardCustomize },
  { id: "tg", name: "Telegram", icon: MdAutoAwesomeMosaic },
  { id: "lang", name: "Languages", icon: MdHexagon },
  { id: "voice", name: "Voice", icon: MdWaves },
  { id: "brand", name: "Branding", icon: MdBlurOn },
];

export function HowItWorksPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const authenticated = useAuthStore((s) => s.authenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme !== "light";
  const startHref = mounted && authenticated ? "/dashboard" : "/login";

  return (
    <div className="landing min-h-screen overflow-x-hidden bg-[var(--lp-parchment)] text-[var(--lp-ink)]">
      <div className="lp-hero relative overflow-hidden border-b border-[var(--lp-hero-border)]">
        <div aria-hidden className="lp-hero-grid pointer-events-none absolute inset-0 opacity-60" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8">
          <LandingHeader
            themeToggle={
              <ThemeToggleButton
                isDark={isDark}
                onToggle={() => setTheme(isDark ? "light" : "dark")}
              />
            }
            navExtra={<NavCta mounted={mounted} authenticated={authenticated} />}
          />

          <div id="top" className="pb-14 pt-8 sm:pb-20 sm:pt-12">
            <div className="mx-auto max-w-3xl text-center">
              <HeroReveal delay={0.05}>
                <p className="lp-section-label text-[var(--lp-hero-muted)]">How it works</p>
              </HeroReveal>
              <HeroReveal delay={0.15}>
                <h1 className="mt-3 text-[2rem] leading-[1.1] tracking-tight text-[var(--lp-hero-fg)] sm:text-5xl">
                  Three steps.{" "}
                  <span className="text-[var(--lp-brand)]">One knowledge base.</span>
                </h1>
              </HeroReveal>
              <HeroReveal delay={0.28}>
                <p className="lp-prose mx-auto mt-5 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-[var(--lp-hero-body)] sm:text-base">
                  Contexts, a website widget, and Telegram — wired together so every answer stays
                  on-brand.
                </p>
              </HeroReveal>
              <HeroReveal delay={0.4}>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/#demo" className="lp-btn-primary">
                    Book a demo
                  </Link>
                  <Link href={startHref} className="lp-btn-secondary">
                    Get started
                  </Link>
                </div>
              </HeroReveal>
            </div>
          </div>
        </div>
      </div>

      <HiwFlowCards />
      <HiwSetupBento />
      <HiwFaq />

      <Cta3
        headline={
          <>
            Ready to deploy <span className="text-[var(--lp-brand)]">Hasab</span>?
          </>
        }
        subtitle="Website widget, Telegram bot, and multilingual support — from one dashboard."
        primaryCta={{ label: "Book a demo", href: "/#demo" }}
        secondaryCta={{ label: "Get started", href: startHref }}
        products={CTA_PRODUCTS}
      />

      <LandingFooter />
    </div>
  );
}
