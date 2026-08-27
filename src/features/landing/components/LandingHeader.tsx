"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { HeroFadeDown } from "@/features/landing/components/LandingMotion";

export interface LandingHeaderProps {
  themeToggle?: ReactNode;
  navExtra?: ReactNode;
}

export function LandingHeader({ themeToggle, navExtra }: LandingHeaderProps) {
  return (
    <HeroFadeDown delay={0}>
      <header className="flex items-center justify-between py-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--lp-hero-fg)]/30"
        >
          <Image
            src="/hasab_ai.png"
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0"
            priority
          />
          <span className="font-display text-lg font-medium tracking-wide text-[var(--lp-hero-fg)]">
            Hasab
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {themeToggle}
          {navExtra}
        </div>
      </header>
    </HeroFadeDown>
  );
}
