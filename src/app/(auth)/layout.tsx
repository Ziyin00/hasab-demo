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
          <Image
            src="/hasab_ai.png"
            alt="Hasab AI"
            width={36}
            height={36}
            className="rounded-lg"
          />
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
