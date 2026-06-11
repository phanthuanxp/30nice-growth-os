import type { Role } from "@/server/auth/session";

const RANK: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  TENANT_ADMIN: 3,
  AGENCY_ADMIN: 4,
  SUPER_ADMIN: 5,
};

export function can(role: Role, minRole: Role): boolean {
  return RANK[role] >= RANK[minRole];
}

export function isSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

export function canEdit(role: Role): boolean {
  return can(role, "EDITOR");
}

export function canAdmin(role: Role): boolean {
  return can(role, "TENANT_ADMIN");
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  AGENCY_ADMIN: "Agency Admin",
  TENANT_ADMIN: "Tenant Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};
