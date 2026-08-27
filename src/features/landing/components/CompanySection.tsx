"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Cloud,
  Headphones,
  Languages,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Reveal,
  Stagger,
  StaggerItem,
} from "@/features/landing/components/LandingMotion";
import { cn } from "@/lib/utils";

const FACTS = [
  {
    label: "Based in",
    value: "Addis Ababa",
    detail: "Africa",
    icon: MapPin,
  },
  {
    label: "Deployment",
    value: "Cloud or on-prem",
    detail: "Continent-ready",
    icon: Cloud,
  },
  {
    label: "Support",
    value: "African team",
    detail: "Your timezone",
    icon: Headphones,
  },
  {
    label: "Languages",
    value: "am · om · en",
    detail: "More coming",
    icon: Languages,
  },
];

export function CompanySection() {
  return (
    <section
      id="company"
      className="border-b border-[var(--lp-border)] bg-[var(--lp-secondary)] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="lp-section-label">The company</p>
          <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
            Built in Africa, for Africa — and here for the long term.
          </h2>
        </Reveal>

        <Reveal className="mt-12">
            <Card
              className={cn(
                "lp-company-card relative gap-0 overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-card)] py-0 shadow-none ring-0"
              )}
            >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[color-mix(in_oklab,var(--lp-brand)_12%,transparent)] to-transparent"
            />
            <CardHeader className="relative gap-4 border-b border-[var(--lp-border)] px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="h-6 rounded-full px-2.5">Hasab AI</Badge>
                <Badge
                  variant="outline"
                  className="h-6 rounded-full border-[var(--lp-border)] bg-transparent text-[var(--lp-muted-fg)]"
                >
                  Africa
                </Badge>
                <Badge
                  variant="outline"
                  className="h-6 rounded-full border-[var(--lp-border)] bg-transparent text-[var(--lp-muted-fg)]"
                >
                  Addis Ababa
                </Badge>
              </div>
              <div className="flex items-start gap-4">
                <Image
                  src="/hasab_ai.png"
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-xl"
                />
                <div className="min-w-0">
                  <CardTitle className="font-display text-2xl font-medium tracking-tight text-[var(--lp-ink)] sm:text-3xl">
                    Built for African languages.
                  </CardTitle>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted-fg)]">
                    Not a market we localise into — the languages communities across the continent
                    speak every day.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:px-8 sm:py-8">
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--lp-muted-fg)] sm:text-base">
                Hasab AI builds speech and assistants starting with Amharic, Afaan Oromo, and English
                — with a roadmap for more African languages. Support on your continent, in your
                timezone, with people who understand the context. We build for African institutions,
                businesses, and citizens — not as an afterthought from abroad.
              </p>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <Button asChild className="rounded-full bg-primary-gradient px-5 text-white hover:opacity-90">
                  <a href="#demo">
                    Talk to us
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-[var(--lp-border)] bg-transparent text-[var(--lp-ink)] hover:bg-[var(--lp-secondary)]"
                >
                  <Link href="https://hasab.ai" target="_blank" rel="noreferrer">
                    hasab.ai
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Stagger className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {FACTS.map((fact) => {
            const Icon = fact.icon;
            return (
              <StaggerItem key={fact.label}>
                <Card className="lp-company-card h-full gap-0 rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-card)] py-0 shadow-none ring-0 transition-transform duration-300 hover:-translate-y-0.5">
                  <CardContent className="flex flex-col gap-3 px-4 py-5 sm:px-5 sm:py-6">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--lp-brand)_12%,transparent)] text-[var(--lp-brand)]">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="lp-section-label">{fact.label}</p>
                      <p className="mt-1 text-sm font-medium tracking-tight text-[var(--lp-ink)]">
                        {fact.value}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--lp-muted-fg)]">{fact.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
