"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const { user, setAuth, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return {
    user,
    isAuthenticated: !!user,
    handleLogout,
  };
};
