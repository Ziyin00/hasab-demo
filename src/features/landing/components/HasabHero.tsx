"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { HeroRotatingHeadline } from "@/features/landing/components/HeroRotatingHeadline";
import { HeroChatPreview } from "@/features/landing/components/HeroChatPreview";
import { HeroReveal } from "@/features/landing/components/LandingMotion";

export interface HasabHeroProps {
  themeToggle?: ReactNode;
  navExtra?: ReactNode;
}

export default function HasabHero({ themeToggle, navExtra }: HasabHeroProps) {
  const authenticated = useAuthStore((s) => s.authenticated);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const startHref = mounted && authenticated ? "/dashboard" : "/login";

  return (
    <div className="lp-hero relative w-full overflow-hidden border-b border-[var(--lp-hero-border)]">
      <div aria-hidden className="lp-hero-grid pointer-events-none absolute inset-0 opacity-60" />
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 size-96 rounded-full bg-primary-gradient opacity-[0.07] blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8">
        <LandingHeader themeToggle={themeToggle} navExtra={navExtra} />

        <main id="top" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="max-w-2xl">
              <HeroReveal delay={0.05}>
                <HeroRotatingHeadline />
              </HeroReveal>

              <HeroReveal delay={0.22}>
                <p className="mt-6 max-w-lg text-pretty text-base leading-[1.75] text-[var(--lp-hero-body)] sm:text-lg">
                  One assistant and one knowledge base for web chat, Telegram, and voice — in
                  Amharic, Afaan Oromo, and English. Your team writes the answers; Hasab delivers
                  them on every channel.
                </p>
              </HeroReveal>

              <HeroReveal delay={0.38}>
                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link href={startHref} className="lp-btn-primary">
                    Get started
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="text-sm font-medium text-[var(--lp-hero-fg)] underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
                  >
                    See how it works
                  </Link>
                </div>
              </HeroReveal>
            </div>

            <HeroReveal delay={0.2} className="justify-self-center lg:justify-self-end">
              <HeroChatPreview />
            </HeroReveal>
          </div>
        </main>
      </div>
    </div>
  );
}

export function ThemeToggleButton({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-9 items-center justify-center border border-[var(--lp-hero-toggle-border)] text-[var(--lp-hero-toggle-fg)] transition-colors hover:text-[var(--lp-hero-fg)]"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
    >
      <span suppressHydrationWarning>
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </span>
    </motion.button>
  );
}

export function NavCta({
  mounted,
  authenticated,
}: {
  mounted: boolean;
  authenticated: boolean;
}) {
  if (mounted && authenticated) {
    return (
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[var(--lp-hero-fg)] underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
      >
        Dashboard
      </Link>
    );
  }
  return (
    <a
      href="#demo"
      className="text-sm font-medium text-[var(--lp-hero-fg)] underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
    >
      Book a demo
    </a>
  );
}
