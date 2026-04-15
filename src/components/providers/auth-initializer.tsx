"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";

export function AuthInitializer() {
  const init = useAuthStore((state) => state.init);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      init();
      initialized.current = true;
    }
  }, [init]);

  return null;
}
