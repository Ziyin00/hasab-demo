"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Autoplay from "embla-carousel-autoplay";
import { useReducedMotion } from "motion/react";
import {
  Activity,
  BookOpen,
  KeyRound,
  MessageCircle,
  Shield,
  type LucideIcon,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Reveal, RevealLeft, RevealRight } from "@/features/landing/components/LandingMotion";
import { cn } from "@/lib/utils";

type AdminSlide = {
  name: string;
  hint: string;
  detail: string;
  icon: LucideIcon;
  mock: ReactNode;
};

function ContextsMock() {
  return (
    <div className="mt-auto space-y-2 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-parchment)] p-3">
      {["Company FAQ", "Identity & tone", "Product knowledge"].map((row, i) => (
        <div
          key={row}
          className="flex items-center gap-2 rounded-lg bg-[var(--lp-card)] px-3 py-2 text-[11px]"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              i === 0 ? "bg-[var(--lp-brand)]" : "bg-[color-mix(in_oklab,var(--lp-ink)_20%,transparent)]"
            )}
          />
          <span className="text-[var(--lp-ink)]">{row}</span>
          <span className="ml-auto text-[var(--lp-muted-fg)]">Live</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsMock() {
  return (
    <div className="mt-auto space-y-3 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-parchment)] p-3">
      <div className="flex items-end gap-1.5 h-16">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary-gradient opacity-80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--lp-muted-fg)]">
        <span>Conversations</span>
        <span className="font-medium text-[var(--lp-brand)]">This week</span>
      </div>
    </div>
  );
}

function ConversationsMock() {
  return (
    <div className="mt-auto space-y-2 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-parchment)] p-3">
      {[
        { q: "How do I renew my ID?", ch: "Web" },
        { q: "የመታወቂያ እድሳት?", ch: "Telegram" },
        { q: "Waraqaa eenyummaa…", ch: "Voice" },
      ].map((row) => (
        <div
          key={row.q}
          className="flex items-center justify-between gap-2 rounded-lg bg-[var(--lp-card)] px-3 py-2"
        >
          <span className="truncate text-[11px] text-[var(--lp-ink)]">{row.q}</span>
          <span className="shrink-0 rounded-md bg-[color-mix(in_oklab,var(--lp-brand)_12%,transparent)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--lp-brand)]">
            {row.ch}
          </span>
        </div>
      ))}
    </div>
  );
}

function ApiKeyMock() {
  return (
    <div className="mt-auto rounded-xl border border-[var(--lp-border)] bg-[var(--lp-parchment)] p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--lp-muted-fg)]">Org API key</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border border-[var(--lp-border)] bg-[var(--lp-card)] px-3 py-2 font-mono text-[11px] text-[var(--lp-ink)]">
          hsb_••••••••••••3f9a
        </code>
        <span className="rounded-md bg-primary-gradient px-2.5 py-1.5 text-[10px] font-medium text-white">
          Rotate
        </span>
      </div>
    </div>
  );
}

function ActivityMock() {
  return (
    <div className="mt-auto space-y-2 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-parchment)] p-3">
      {[
        { who: "Sara", what: "Updated context", when: "2m" },
        { who: "Admin", what: "Rotated API key", when: "1h" },
        { who: "Kidus", what: "Published widget", when: "3h" },
      ].map((row) => (
        <div key={row.what} className="flex items-center gap-2 text-[11px]">
          <span className="flex size-6 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--lp-brand)_14%,transparent)] text-[9px] font-semibold text-[var(--lp-brand)]">
            {row.who[0]}
          </span>
          <span className="min-w-0 flex-1 truncate text-[var(--lp-ink)]">
            <span className="font-medium">{row.who}</span> {row.what}
          </span>
          <span className="text-[var(--lp-muted-fg)]">{row.when}</span>
        </div>
      ))}
    </div>
  );
}

const SLIDES: AdminSlide[] = [
  {
    name: "Contexts",
    hint: "Knowledge your team controls",
    detail: "Curate FAQs, identity, and product facts. Attach the right knowledge to every channel.",
    icon: BookOpen,
    mock: <ContextsMock />,
  },
  {
    name: "Analytics",
    hint: "See what people ask",
    detail: "Traffic, satisfaction, and gaps — so unanswered questions become your content backlog.",
    icon: Activity,
    mock: <AnalyticsMock />,
  },
  {
    name: "Conversations",
    hint: "Searchable inbox",
    detail: "Full transcripts across web, Telegram, and voice — review and improve in one place.",
    icon: MessageCircle,
    mock: <ConversationsMock />,
  },
  {
    name: "API key",
    hint: "Org credentials",
    detail: "Integrate with your stack. Rotate keys anytime without rebuilding the assistant.",
    icon: KeyRound,
    mock: <ApiKeyMock />,
  },
  {
    name: "Activity",
    hint: "Clear audit trail",
    detail: "Who changed what, and when — so governance stays simple for org admins.",
    icon: Shield,
    mock: <ActivityMock />,
  },
];

export function DashboardAnalyticsSlider() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const reduceMotion = useReducedMotion();

  const [autoplayPlugin] = useState(() =>
    Autoplay({
      delay: 3500,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      playOnInit: true,
    })
  );

  const onSelect = useCallback((embla: CarouselApi) => {
    if (!embla) return;
    setCurrent(embla.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    onSelect(api);
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    if (reduceMotion) {
      autoplayPlugin.stop();
    } else {
      autoplayPlugin.play();
    }

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect, autoplayPlugin, reduceMotion]);

  return (
    <section id="internal" className="border-b border-[var(--lp-border)] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-end">
          <RevealLeft>
            <p className="lp-section-label">Dashboard &amp; analytics</p>
            <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-4xl">
              Run it without engineers.
            </h2>
          </RevealLeft>
          <RevealRight delay={0.08}>
            <p className="leading-relaxed text-[var(--lp-muted-fg)]">
              Communications and service teams edit content directly, publish instantly, and see
              what people actually ask. Org admins get everything needed to run chat.hasab.ai —
              members ship, admins govern.
            </p>
          </RevealRight>
        </div>

        <Reveal className="mt-14">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true }}
            plugins={reduceMotion ? [] : [autoplayPlugin]}
            className="w-full"
            onMouseEnter={() => autoplayPlugin.stop()}
            onMouseLeave={() => {
              if (!reduceMotion) autoplayPlugin.play();
            }}
          >
            <CarouselContent className="-ml-4">
              {SLIDES.map((slide) => {
                const Icon = slide.icon;
                return (
                  <CarouselItem
                    key={slide.name}
                    className="pl-4 basis-[88%] sm:basis-[55%] lg:basis-[38%]"
                  >
                    <article className="lp-admin-slide relative flex h-full min-h-[320px] flex-col overflow-hidden border border-[var(--lp-border)] bg-[var(--lp-card)] p-6">
                      <div className="flex items-start justify-between gap-3">
                        <span className="lp-channel-icon flex size-11 items-center justify-center">
                          <Icon className="size-5" />
                        </span>
                        <span className="rounded-full border border-[var(--lp-border)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--lp-muted-fg)]">
                          {slide.hint}
                        </span>
                      </div>
                      <h3 className="mt-5 text-xl font-medium tracking-tight">
                        {slide.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted-fg)]">
                        {slide.detail}
                      </p>
                      <div className="mt-6 flex flex-1 flex-col">{slide.mock}</div>
                    </article>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2" role="tablist" aria-label="Dashboard slides">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`Go to slide ${i + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === current
                        ? "w-8 bg-primary-gradient"
                        : "w-1.5 bg-[var(--lp-border)] hover:bg-[color-mix(in_oklab,var(--lp-brand)_40%,var(--lp-border))]"
                    )}
                    onClick={() => api?.scrollTo(i)}
                  />
                ))}
              </div>

              <div className="relative flex items-center gap-2">
                <CarouselPrevious
                  className="static translate-x-0 translate-y-0 border-[var(--lp-border)] bg-[var(--lp-card)] text-[var(--lp-ink)] hover:bg-[var(--lp-secondary)] hover:text-[var(--lp-brand)] disabled:opacity-40"
                />
                <CarouselNext
                  className="static translate-x-0 translate-y-0 border-[var(--lp-border)] bg-[var(--lp-card)] text-[var(--lp-ink)] hover:bg-[var(--lp-secondary)] hover:text-[var(--lp-brand)] disabled:opacity-40"
                />
              </div>
            </div>
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}
