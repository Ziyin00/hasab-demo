"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BotAvatarProps {
  src?: string | null;
  initials: string;
  className?: string;
  alt?: string;
}

export function BotAvatar({ src, initials, className, alt = "" }: BotAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const show = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border bg-muted/40",
        className
      )}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={alt}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
          {initials.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
