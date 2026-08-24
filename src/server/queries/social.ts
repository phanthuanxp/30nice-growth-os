import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth/session";

function accessibleTenantWhere(userId: string, role: string): Prisma.TenantWhereInput {
  if (role === "SUPER_ADMIN") return {};
  if (role === "AGENCY_ADMIN") {
    return { organization: { members: { some: { userId } } } };
  }
  return { members: { some: { userId } } };
}

export async function getSocialTenants() {
  const user = await requireAuth();
  return prisma.tenant.findMany({
    where: accessibleTenantWhere(user.id, user.role),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      socialWorkspaces: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, slug: true, status: true },
      },
    },
  });
}

export async function getSocialOverview() {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);

  const [workspaces, pageCount, pages, contents, groups, recentContents] = await Promise.all([
    prisma.socialWorkspace.count({ where: { tenant: tenantWhere, status: { not: "ARCHIVED" } } }),
    prisma.socialPage.count({ where: { workspace: { tenant: tenantWhere }, status: { not: "ARCHIVED" } } }),
    prisma.socialPage.findMany({
      where: { workspace: { tenant: tenantWhere }, status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        workspace: { select: { id: true, name: true, tenant: { select: { id: true, name: true } } } },
        _count: { select: { contents: true, plans: true } },
      },
    }),
    prisma.socialContent.groupBy({
      by: ["status"],
      where: { socialPage: { workspace: { tenant: tenantWhere } } },
      _count: { _all: true },
    }),
    prisma.socialGroup.count({ where: { workspace: { tenant: tenantWhere }, status: "APPROVED" } }),
    prisma.socialContent.findMany({
      where: { socialPage: { workspace: { tenant: tenantWhere } } },
      orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
      take: 10,
      include: { socialPage: { select: { id: true, name: true } } },
    }),
  ]);

  const contentCounts = Object.fromEntries(contents.map((row) => [row.status, row._count._all]));
  return { workspaces, pageCount, pages, groups, contentCounts, recentContents };
}

export async function getSocialPages(workspaceId?: string) {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);
  return prisma.socialPage.findMany({
    where: {
      workspaceId: workspaceId || undefined,
      workspace: { tenant: tenantWhere },
      status: { not: "ARCHIVED" },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      workspace: { include: { tenant: { select: { id: true, name: true } } } },
      connection: { select: { connectionStatus: true, lastValidatedAt: true } },
      _count: { select: { plans: true, contents: true } },
    },
  });
}

export async function getSocialPlans(socialPageId?: string) {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);
  return prisma.socialContentPlan.findMany({
    where: {
      socialPageId: socialPageId || undefined,
      workspace: { tenant: tenantWhere },
    },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: {
      socialPage: { select: { id: true, name: true, status: true } },
      workspace: { select: { id: true, name: true, tenant: { select: { id: true, name: true } } } },
      contents: { orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }] },
    },
  });
}

export async function getSocialGroups(workspaceId?: string) {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);
  return prisma.socialGroup.findMany({
    where: { workspaceId: workspaceId || undefined, workspace: { tenant: tenantWhere } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      workspace: { select: { id: true, name: true, tenant: { select: { id: true, name: true } } } },
      _count: { select: { publishTargets: true } },
    },
  });
}
