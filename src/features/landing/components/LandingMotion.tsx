"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  fadeDown,
  fadeUp,
  scaleIn,
  slideFromLeft,
  slideFromRight,
  staggerContainer,
  staggerItem,
  viewportOnce,
  EASE_SMOOTH,
} from "../motion";

function useMotionSafe() {
  return !useReducedMotion();
}

type BaseProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className, delay = 0 }: BaseProps) {
  const animate = useMotionSafe();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUp}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

export function RevealLeft({ children, className, delay = 0 }: BaseProps) {
  const animate = useMotionSafe();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={slideFromLeft}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

export function RevealRight({ children, className, delay = 0 }: BaseProps) {
  const animate = useMotionSafe();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={slideFromRight}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

export function RevealScale({ children, className, delay = 0 }: BaseProps) {
  const animate = useMotionSafe();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={scaleIn}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

export function HeroReveal({ children, className, delay = 0 }: BaseProps) {
  const animate = useMotionSafe();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.75, ease: EASE_SMOOTH, delay }}
    >
      {children}
    </motion.div>
  );
}

export function HeroFadeDown({ children, className, delay = 0 }: BaseProps) {
  const animate = useMotionSafe();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={fadeDown}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul";
}) {
  const animate = useMotionSafe();
  const Tag = as === "ul" ? motion.ul : motion.div;

  if (!animate) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
  hover?: boolean;
}) {
  const animate = useMotionSafe();
  const Tag = as === "li" ? motion.li : motion.div;

  if (!animate) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={cn(hover && "lp-stagger-row", className)}
      variants={staggerItem}
      whileHover={hover ? { x: 6 } : undefined}
      transition={hover ? { type: "spring", stiffness: 400, damping: 28 } : undefined}
    >
      {children}
    </Tag>
  );
}
