"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const { user, authenticated, logout, loadingState } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return {
    user,
    isAuthenticated: authenticated,
    isLoading: loadingState,
    handleLogout,
  };
};
