"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const ROTATE_MS = 4800;

const HEADLINE_BASE =
  "font-ethiopic font-medium tracking-[-0.02em] text-balance text-[var(--lp-hero-fg)]";

const HEADLINES = [
  {
    lang: "Amharic",
    code: "am",
    text: "ሰላም እንዴት ልርዳዎት?",
    sizeClass: "text-[2.25rem] leading-[1.12] sm:text-[3.25rem]",
  },
  {
    lang: "English",
    code: "en",
    text: "Hello. How can I help you today?",
    sizeClass: "text-[1.875rem] leading-[1.2] sm:text-[2.75rem]",
  },
  {
    lang: "Afaan Oromo",
    code: "om",
    text: "Akkam? Akkamittin si gargaaruu danda'a?",
    sizeClass: "text-[1.75rem] leading-[1.2] sm:text-[2.625rem]",
  },
] as const;

function headlineClass(sizeClass: string) {
  return cn(HEADLINE_BASE, sizeClass);
}

export function HeroRotatingHeadline() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = HEADLINES[index];

  useEffect(() => {
    if (reduceMotion || paused) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HEADLINES.length);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [paused, reduceMotion]);

  return (
    <div
      className="space-y-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        id="hero-headline-panel"
        role="tabpanel"
        aria-labelledby={`hero-lang-${active.code}`}
        aria-live="polite"
        className="relative"
      >
        {/* Invisible sizers — grid row height follows the tallest headline */}
        <div className="grid">
          {HEADLINES.map((item) => (
            <h1
              key={`measure-${item.code}`}
              aria-hidden
              className={cn(
                headlineClass(item.sizeClass),
                "invisible col-start-1 row-start-1 pointer-events-none select-none"
              )}
            >
              {item.text}
            </h1>
          ))}

          {reduceMotion ? (
            <h1 className={cn(headlineClass(active.sizeClass), "col-start-1 row-start-1")}>
              {active.text}
            </h1>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={active.code}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={cn(headlineClass(active.sizeClass), "col-start-1 row-start-1")}
              >
                {active.text}
              </motion.h1>
            </AnimatePresence>
          )}
        </div>

        <motion.div
          key={active.code}
          aria-hidden
          className="pointer-events-none absolute -bottom-2 left-0 h-px origin-left bg-gradient-to-r from-[var(--lp-brand)] via-[var(--lp-brand-hot)] to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: paused ? 0.35 : 1 }}
          transition={{ duration: paused ? 0.25 : ROTATE_MS / 1000, ease: "linear" }}
          style={{ width: "min(12rem, 40%)" }}
        />
      </div>
    </div>
  );
}
