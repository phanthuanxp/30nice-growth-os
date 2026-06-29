import { prisma } from "@/server/db";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getLeadsByDay(days = 30, tenantId?: string) {
  // Returns daily post publish counts (repurposed from lead tracking)
  const since = daysAgo(days);
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: since },
      ...(tenantId ? { tenantId } : {}),
    },
    select: { publishedAt: true },
    orderBy: { publishedAt: "asc" },
  });

  const byDate: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    byDate[d.toISOString().split("T")[0]] = 0;
  }
  for (const p of posts) {
    if (!p.publishedAt) continue;
    const key = p.publishedAt.toISOString().split("T")[0];
    if (key in byDate) byDate[key]++;
  }

  return Object.entries(byDate).map(([date, count]) => ({ date, count }));
}

export async function getLeadSourceBreakdown(tenantId?: string) {
  // Returns top content categories by post count
  const where = tenantId ? { tenantId } : {};
  const posts = await prisma.post.findMany({
    where: { ...where, status: "PUBLISHED" },
    select: { category: { select: { name: true } } },
  });

  const bySource: Record<string, { total: number; won: number }> = {};
  for (const p of posts) {
    const key = p.category?.name ?? "(Không phân loại)";
    if (!bySource[key]) bySource[key] = { total: 0, won: 0 };
    bySource[key].total++;
  }

  return Object.entries(bySource)
    .map(([source, data]) => ({ source, ...data, rate: 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

export async function getContentStats(tenantId?: string) {
  const where = tenantId ? { tenantId } : {};
  const [publishedPages, publishedPosts, totalPosts] = await Promise.all([
    prisma.page.count({ where: { ...where, status: "PUBLISHED" } }),
    prisma.post.count({ where: { ...where, status: "PUBLISHED" } }),
    prisma.post.count({ where }),
  ]);
  return { publishedPages, publishedPosts, totalLeads: totalPosts, leadsByStatus: { NEW: totalPosts } };
}

export async function getTenantComparison() {
  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    include: { _count: { select: { pages: true, posts: true } } },
    orderBy: { name: "asc" },
  });

  return tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    pages: t._count.pages,
    posts: t._count.posts,
    leads: 0,
    newLeads: 0,
    wonLeads: 0,
  }));
}

export async function getPageviewsByDay(days = 30, tenantId?: string) {
  const since = daysAgo(days);
  const events = await prisma.analyticsEvent.findMany({
    where: {
      type: "pageview",
      createdAt: { gte: since },
      ...(tenantId ? { tenantId } : {}),
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDate: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    byDate[d.toISOString().split("T")[0]] = 0;
  }
  for (const e of events) {
    const key = e.createdAt.toISOString().split("T")[0];
    if (key in byDate) byDate[key]++;
  }

  return Object.entries(byDate).map(([date, count]) => ({ date, count }));
}

export async function getTopPages(days = 30, tenantId?: string, limit = 10) {
  const since = daysAgo(days);
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["path"],
    where: {
      type: "pageview",
      createdAt: { gte: since },
      ...(tenantId ? { tenantId } : {}),
    },
    _count: true,
    orderBy: { _count: { path: "desc" } },
    take: limit,
  });
  return grouped.map((g) => ({ path: g.path, views: g._count }));
}

export async function getDeviceBreakdown(days = 30, tenantId?: string) {
  const since = daysAgo(days);
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["device"],
    where: {
      type: "pageview",
      createdAt: { gte: since },
      ...(tenantId ? { tenantId } : {}),
    },
    _count: true,
  });
  const result = { mobile: 0, desktop: 0 };
  for (const g of grouped) {
    if (g.device === "mobile") result.mobile = g._count;
    else if (g.device === "desktop") result.desktop = g._count;
  }
  return result;
}

export async function getTopReferrers(days = 30, tenantId?: string, limit = 8) {
  const since = daysAgo(days);
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["referrer"],
    where: {
      type: "pageview",
      referrer: { not: null },
      createdAt: { gte: since },
      ...(tenantId ? { tenantId } : {}),
    },
    _count: true,
    orderBy: { _count: { referrer: "desc" } },
    take: limit,
  });
  return grouped.map((g) => ({ referrer: g.referrer ?? "(direct)", views: g._count }));
}

export async function getTrafficSummary(days = 30, tenantId?: string) {
  const since = daysAgo(days);
  const [pageviews, posts] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { type: "pageview", createdAt: { gte: since }, ...(tenantId ? { tenantId } : {}) },
    }),
    prisma.post.count({
      where: { status: "PUBLISHED", publishedAt: { gte: since }, ...(tenantId ? { tenantId } : {}) },
    }),
  ]);
  const conversionRate = pageviews > 0 ? (posts / pageviews) * 100 : 0;
  return { pageviews, leads: posts, conversionRate };
}
