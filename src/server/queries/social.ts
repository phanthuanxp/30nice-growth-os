import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth/session";
import { startOfDayInOffset, timezoneOffsetHours } from "@/server/social/group-rules";

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
      connection: { select: { connectionStatus: true, lastValidatedAt: true, tokenExpiresAt: true, grantedScopes: true } },
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

export async function getSocialContent(contentId: string) {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);
  return prisma.socialContent.findFirst({
    where: { id: contentId, socialPage: { workspace: { tenant: tenantWhere } } },
    include: {
      socialPage: {
        include: {
          workspace: { select: { id: true, name: true, tenant: { select: { id: true, name: true } } } },
        },
      },
      plan: { select: { id: true, title: true } },
      revisions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function getSocialCalendar(input: { socialPageId?: string; from: Date; to: Date }) {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);
  return prisma.socialContent.findMany({
    where: {
      socialPageId: input.socialPageId || undefined,
      socialPage: { workspace: { tenant: tenantWhere } },
      scheduledAt: { gte: input.from, lt: input.to },
      status: { not: "SKIPPED" },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    include: { socialPage: { select: { id: true, name: true } }, plan: { select: { id: true, title: true } } },
  });
}

export async function getSocialPublishing(socialPageId?: string) {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);
  const targets = await prisma.socialPublishTarget.findMany({
    where: { socialPageId: socialPageId || undefined, targetType: "PAGE", socialPage: { workspace: { tenant: tenantWhere } } },
    orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      content: { select: { id: true, title: true, topic: true, status: true } },
      socialPage: { select: { id: true, name: true, status: true, externalPageId: true, connection: { select: { connectionStatus: true } } } },
      insight: true,
    },
  });
  const counts = Object.fromEntries(["SCHEDULED", "PUBLISHED", "FAILED"].map((status) => [status, targets.filter((target) => target.status === status).length]));
  return { targets, counts };
}

export async function getSocialGroups(workspaceId?: string) {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);
  const groups = await prisma.socialGroup.findMany({
    where: { workspaceId: workspaceId || undefined, workspace: { tenant: tenantWhere } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      workspace: { select: { id: true, name: true, timezone: true, tenant: { select: { id: true, name: true } } } },
      _count: { select: { publishTargets: true } },
    },
  });
  if (groups.length === 0) return [];

  // Recent activity drives the daily-limit and cooldown badges in the library.
  // Groups can span workspaces on different time zones, so the calendar day is
  // resolved per group rather than once for the whole list.
  const now = new Date();
  const ids = groups.map((group) => group.id);
  const [recent, lastRows] = await Promise.all([
    prisma.socialPublishTarget.findMany({
      where: {
        socialGroupId: { in: ids },
        status: "PUBLISHED",
        // Widest possible local day plus a margin, narrowed per group below.
        publishedAt: { gte: new Date(now.getTime() - 48 * 60 * 60_000) },
      },
      select: { socialGroupId: true, publishedAt: true },
    }),
    // Cooldown can reach 30 days, so the last post is read exactly rather than
    // from the 48-hour window above.
    prisma.socialPublishTarget.groupBy({
      by: ["socialGroupId"],
      where: { socialGroupId: { in: ids }, status: "PUBLISHED", publishedAt: { not: null } },
      _max: { publishedAt: true },
    }),
  ]);

  const todayCandidates = new Map<string, Date[]>();
  for (const row of recent) {
    if (!row.socialGroupId || !row.publishedAt) continue;
    const bucket = todayCandidates.get(row.socialGroupId);
    if (bucket) bucket.push(row.publishedAt);
    else todayCandidates.set(row.socialGroupId, [row.publishedAt]);
  }
  const lastPostedAt = new Map(lastRows.flatMap((row) => (row.socialGroupId ? [[row.socialGroupId, row._max.publishedAt] as const] : [])));

  return groups.map((group) => {
    const dayStart = startOfDayInOffset(now, timezoneOffsetHours(group.workspace.timezone, now));
    return {
      ...group,
      postsToday: (todayCandidates.get(group.id) ?? []).filter((date) => date >= dayStart).length,
      lastPostedAt: lastPostedAt.get(group.id) ?? null,
    };
  });
}

/** The group distribution queue: one row per group target, newest first. */
export async function getGroupDistributionQueue(workspaceId?: string) {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);
  return prisma.socialPublishTarget.findMany({
    where: {
      targetType: "GROUP",
      socialGroup: workspaceId ? { workspaceId } : undefined,
      socialPage: { workspace: { tenant: tenantWhere } },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      content: { select: { id: true, title: true, topic: true, status: true } },
      socialGroup: { select: { id: true, name: true, groupUrl: true, mode: true, status: true } },
      socialPage: { select: { id: true, name: true } },
    },
  });
}

/** Groups a given content item may be distributed into, plus its existing targets. */
export async function getSocialContentDistribution(contentId: string) {
  const user = await requireAuth();
  const tenantWhere = accessibleTenantWhere(user.id, user.role);
  const content = await prisma.socialContent.findFirst({
    where: { id: contentId, socialPage: { workspace: { tenant: tenantWhere } } },
    select: { id: true, status: true, socialPage: { select: { workspaceId: true } } },
  });
  if (!content) return null;

  const [groups, targets] = await Promise.all([
    prisma.socialGroup.findMany({
      where: { workspaceId: content.socialPage.workspaceId, status: "APPROVED", mode: { not: "DISABLED" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, mode: true, topics: true, dailyPostLimit: true, cooldownHours: true, allowLinks: true, allowPromotion: true, apiVerifiedAt: true },
    }),
    prisma.socialPublishTarget.findMany({
      where: { socialContentId: contentId, targetType: "GROUP" },
      orderBy: { scheduledAt: "asc" },
      include: { socialGroup: { select: { id: true, name: true, groupUrl: true, mode: true } } },
    }),
  ]);
  return { contentStatus: content.status, groups, targets };
}
