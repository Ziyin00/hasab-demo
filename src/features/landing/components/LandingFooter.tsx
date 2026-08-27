"use client";

import Image from "next/image";
import { Reveal, Stagger, StaggerItem } from "@/features/landing/components/LandingMotion";

const LINKS = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Platform", href: "/#platform" },
  { label: "Languages", href: "/#languages" },
  { label: "Company", href: "/#company" },
  { label: "Contact", href: "/#demo" },
  { label: "hasab.ai", href: "https://hasab.ai" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--lp-border)] bg-[var(--lp-parchment)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <Reveal className="max-w-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <Image
              src="/hasab_ai.png"
              alt=""
              width={28}
              height={28}
              className="size-7 shrink-0"
            />
            <span className="font-display text-base font-medium text-[var(--lp-ink)]">Hasab</span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--lp-muted-fg)]">
            Hasab AI · Africa · Addis Ababa
          </p>
          <a
            href="mailto:contact@hasab.ai"
            className="inline-block text-sm text-[var(--lp-ink)] underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
          >
            contact@hasab.ai
          </a>
        </Reveal>

        <Stagger className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <StaggerItem key={link.label}>
              <a
                href={link.href}
                className="text-sm text-[var(--lp-muted-fg)] underline-offset-4 transition-colors hover:text-[var(--lp-ink)] hover:underline"
              >
                {link.label}
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </footer>
  );
}
