import type { SVGProps } from "react";

/** Hasab mark — drop-in replacement for Watermelon LogoIcon */
export default function LogoIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
      {...props}
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <path
        d="M9 8v16M23 8v16M9 16h14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
      <path
        d="M23 12h4"
        stroke="#7C20D0"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
