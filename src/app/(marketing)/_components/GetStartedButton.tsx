"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export function GetStartedButton() {
  const router = useRouter();
  const authenticated = useAuthStore((s) => s.authenticated);

  return (
    <button
      onClick={() => router.push(authenticated ? "/dashboard" : "/login")}
      className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium"
    >
      Get Started
    </button>
  );
}
