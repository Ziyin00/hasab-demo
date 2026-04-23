import React from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <Image
          src="/auth-line-bg.jpg"
          alt="background"
          fill
          className="object-cover"
          priority
        />
        {/* dark overlay to deepen the image */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
          <div className="w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
              <path
                d="M20 2L36 11V29L20 38L4 29V11L20 2Z"
                stroke="#a855f7"
                strokeWidth="2"
                fill="rgba(168,85,247,0.15)"
              />
              <text
                x="50%"
                y="54%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="#a855f7"
                fontFamily="monospace"
              >
                {"<>"}
              </text>
            </svg>
          </div>
          <h1 className="text-white font-semibold text-lg tracking-tight">
            Hasab AI
          </h1>
        </div>

        {/* Bottom tagline */}
        <div className="absolute bottom-12 left-8 right-8 z-10">
          <h2 className="text-white text-3xl font-bold mb-3">
            Join The Future Of AI
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Experience the power of cutting-edge voice AI technology. Transform
            your speech into text effortlessly, accurately, and faster than ever
            before.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
