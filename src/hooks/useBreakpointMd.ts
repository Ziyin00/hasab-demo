"use client";

import { useEffect, useState } from "react";

const MQ = "(min-width: 768px)";

/** True when viewport matches Tailwind `md` (≥768px). SSR/first paint: false until measured. */
export function useBreakpointMd() {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MQ);
    const update = () => setIsMd(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMd;
}
