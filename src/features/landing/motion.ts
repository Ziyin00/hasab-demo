import type { Transition, Variants } from "motion/react";

export const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;

export const SPRING_SNAPPY = {
  type: "spring",
  stiffness: 380,
  damping: 28,
} as const satisfies Transition;

export const SPRING_SOFT = {
  type: "spring",
  stiffness: 220,
  damping: 26,
} as const satisfies Transition;

export const viewportOnce = { once: true, margin: "-72px" as const };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_SMOOTH, delay },
  }),
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_SMOOTH, delay },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_SMOOTH, delay },
  }),
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -36, filter: "blur(4px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: EASE_SMOOTH, delay },
  }),
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 36, filter: "blur(4px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: EASE_SMOOTH, delay },
  }),
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_SMOOTH, delay },
  }),
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_SMOOTH },
  },
};

export const cardHover = {
  y: -6,
  transition: SPRING_SNAPPY,
};
