import { requireAuth, type Role, type SessionUser } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { prisma } from "@/server/db";

/**
 * Asserts the current user may act on the given tenant with at least `minRole`.
 * - SUPER_ADMIN: full access
 * - AGENCY_ADMIN: tenants belonging to their organizations
 * - TENANT_ADMIN / EDITOR / VIEWER: tenants they are a member of (membership role
 *   may elevate above the global role for that tenant)
 * Throws on failure so Server Actions fail closed.
 */
export async function requireTenantAccess(tenantId: string, minRole: Role = "EDITOR"): Promise<SessionUser> {
  const user = await requireAuth();

  if (user.role === "SUPER_ADMIN") return user;

  if (user.role === "AGENCY_ADMIN") {
    if (!can(user.role, minRole)) throw new Error("Không đủ quyền");
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { organizationId: true },
    });
    if (!tenant?.organizationId) throw new Error("Không có quyền với site này");
    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: tenant.organizationId, userId: user.id } },
      select: { id: true },
    });
    if (!membership) throw new Error("Không có quyền với site này");
    return user;
  }

  const membership = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId, userId: user.id } },
    select: { role: true },
  });
  if (!membership) throw new Error("Không có quyền với site này");

  const effectiveRole: Role = can(membership.role, user.role) ? membership.role : user.role;
  if (!can(effectiveRole, minRole)) throw new Error("Không đủ quyền");
  return user;
}

/** Non-throwing variant for use in queries/pages. */
export async function checkTenantAccess(tenantId: string, minRole: Role = "VIEWER"): Promise<boolean> {
  try {
    await requireTenantAccess(tenantId, minRole);
    return true;
  } catch {
    return false;
  }
}
