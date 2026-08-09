import type { User } from "@/types/api.types";

/** Canonical role_id values from the Hasab profile API */
export const ROLE_ID = {
  ADMIN: 1,
  MEMBER: 2,
} as const;

export type AccessLevel = "all" | "org" | "admin";

const ADMIN_ROLE_NAMES = new Set(["admin", "owner", "organisation admin", "organization admin"]);
const MEMBER_ROLE_NAMES = new Set(["member", "user"]);

function roleId(user: User | null | undefined): number | null {
  if (!user) return null;
  const raw = user.role_id ?? user.role?.id;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function roleKey(user: User | null | undefined): string {
  const slug = user?.role?.slug?.trim().toLowerCase() ?? "";
  const name = user?.role?.name?.trim().toLowerCase() ?? "";
  return slug || name;
}

/**
 * Org membership helpers (ported from hasab-dashboard-v2).
 * Some accounts belong to an organization but still have user_type "individual"
 * (e.g. after invite/join). Treat organization_id / organization as membership too.
 */
export function isOrgUser(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.user_type === "organization") return true;
  if (user.organization_id != null && String(user.organization_id) !== "") return true;
  if (user.organization?.id != null && String(user.organization.id) !== "") return true;
  return false;
}

/**
 * Org admin / owner.
 * Prefer role_id === 1, but also accept role.id / slug / name and organization.is_owner
 * because some profiles return Admin in `role.name` without a reliable role_id.
 */
export function isOrgAdmin(user: User | null | undefined): boolean {
  if (!isOrgUser(user)) return false;
  if (user?.organization?.is_owner) return true;

  const id = roleId(user);
  if (id === ROLE_ID.ADMIN) return true;
  if (id === ROLE_ID.MEMBER) return false;

  const key = roleKey(user);
  if (key && ADMIN_ROLE_NAMES.has(key)) return true;
  if (key && MEMBER_ROLE_NAMES.has(key)) return false;

  return false;
}

/** Org member — not an admin */
export function isOrgMember(user: User | null | undefined): boolean {
  return isOrgUser(user) && !isOrgAdmin(user);
}

export function hasAccess(
  user: User | null | undefined,
  level: AccessLevel = "all"
): boolean {
  if (level === "all") return true;
  if (level === "org") return isOrgUser(user);
  if (level === "admin") return isOrgAdmin(user);
  return false;
}

export function roleLabel(user: User | null | undefined): string {
  if (!user) return "";
  if (!isOrgUser(user)) return "Individual";
  if (isOrgAdmin(user)) return user.role?.name || "Admin";
  return user.role?.name || "Member";
}
