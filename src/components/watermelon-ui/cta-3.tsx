"use client";

import React from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MdArrowOutward,
  MdPlayArrow,
  MdDashboardCustomize,
  MdAutoAwesomeMosaic,
  MdWaves,
  MdDonutSmall,
  MdHexagon,
  MdBlurOn,
} from "react-icons/md";
import type { IconType } from "react-icons";
import { RevealLeft, RevealRight } from "@/features/landing/components/LandingMotion";
import { cardHover, staggerContainer, staggerItem, viewportOnce } from "@/features/landing/motion";

export interface ProductCardItem {
  id: string;
  name: string;
  icon: IconType;
}

export interface HeroProductSectionProps {
  badgeText?: string;
  headline?: React.ReactNode;
  subtitle?: string;
  primaryCta?: { label: string; href?: string; onClick?: () => void };
  secondaryCta?: { label: string; href?: string; onClick?: () => void };
  products?: ProductCardItem[];
}

const DEFAULT_PRODUCTS: ProductCardItem[] = [
  { id: "web", name: "Web chat", icon: MdDashboardCustomize },
  { id: "tg", name: "Telegram", icon: MdAutoAwesomeMosaic },
  { id: "voice", name: "Voice", icon: MdWaves },
  { id: "kb", name: "Knowledge", icon: MdDonutSmall },
  { id: "lang", name: "Languages", icon: MdHexagon },
  { id: "analytics", name: "Analytics", icon: MdBlurOn },
];

function ProductCard({ name, icon: Icon }: Omit<ProductCardItem, "id">) {
  return (
    <motion.div variants={staggerItem} whileHover={cardHover}>
      <Card className="group relative flex h-24 items-center justify-center overflow-hidden rounded-lg border border-[var(--lp-border)] bg-black p-0 shadow-none ring-0 transition-colors hover:border-[#7C20D0]/40">
        <div className="flex size-full flex-col items-center justify-center gap-2">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--lp-muted-fg)] transition-colors group-hover:text-[#7C20D0]"
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
            transition={{ duration: 0.45 }}
          >
            <Icon className="text-2xl" />
          </motion.div>
          <span className="text-sm font-semibold tracking-tight text-[var(--lp-ink)]">
            {name}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

export default function Cta3({
  headline = "Explore what's next",
  subtitle = "Transform your workflow with intuitive tools.",
  primaryCta = { label: "Start your free trial" },
  secondaryCta = { label: "How it works?" },
  products = DEFAULT_PRODUCTS,
}: HeroProductSectionProps) {
  return (
    <section
      id="channels"
      className="w-full overflow-x-clip border-t border-[var(--lp-border)] bg-[var(--lp-parchment)] py-20 sm:py-24"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <RevealLeft className="flex w-full min-w-0 flex-col items-start gap-6">
          <div className="flex w-full min-w-0 flex-col gap-4">
            <h2 className="w-full text-balance break-words text-3xl font-semibold tracking-tight text-[var(--lp-ink)] sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              {headline}
            </h2>

            <p className="max-w-md text-pretty text-base leading-relaxed text-[var(--lp-muted-fg)] sm:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                className="h-11 rounded-full border-0 bg-primary-gradient px-6 font-medium text-white shadow-none hover:opacity-90"
                onClick={primaryCta.onClick}
                asChild={!!primaryCta.href}
              >
                {primaryCta.href ? (
                  <a href={primaryCta.href} className="inline-flex items-center gap-2">
                    {primaryCta.label}
                    <MdArrowOutward className="h-4 w-4" />
                  </a>
                ) : (
                  <button type="button" className="inline-flex items-center gap-2">
                    {primaryCta.label}
                    <MdArrowOutward className="h-4 w-4" />
                  </button>
                )}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="h-11 gap-2 rounded-full border-[var(--lp-border)] bg-transparent px-6 text-[15px] font-medium text-[var(--lp-ink)] shadow-none hover:bg-[var(--lp-secondary)]"
                onClick={secondaryCta.onClick}
                asChild={!!secondaryCta.href}
              >
                {secondaryCta.href ? (
                  <a href={secondaryCta.href} className="inline-flex items-center gap-2">
                    <MdPlayArrow className="size-5 text-[var(--lp-muted-fg)]" />
                    {secondaryCta.label}
                  </a>
                ) : (
                  <button type="button" className="inline-flex items-center gap-2">
                    <MdPlayArrow className="size-5 text-[var(--lp-muted-fg)]" />
                    {secondaryCta.label}
                  </button>
                )}
              </Button>
            </motion.div>
          </div>
        </RevealLeft>

        <RevealRight delay={0.1}>
          <motion.div
            className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {products.map(({ id, ...rest }) => (
              <ProductCard key={id} {...rest} />
            ))}
          </motion.div>
        </RevealRight>
      </div>
    </section>
  );
}
