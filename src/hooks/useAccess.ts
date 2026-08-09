"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/store/auth.store";
import {
  hasAccess,
  isOrgAdmin,
  isOrgMember,
  isOrgUser,
  roleLabel,
  type AccessLevel,
} from "@/lib/userAccess";

export function useAccess() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  return useMemo(
    () => ({
      user,
      initialized,
      isOrgUser: isOrgUser(user),
      isOrgAdmin: isOrgAdmin(user),
      isOrgMember: isOrgMember(user),
      roleLabel: roleLabel(user),
      can: (level: AccessLevel) => hasAccess(user, level),
    }),
    [user, initialized]
  );
}
