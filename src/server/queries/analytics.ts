import { prisma } from "@/server/db";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getLeadsByDay(days = 30, tenantId?: string) {
  const since = daysAgo(days);
  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: since },
      ...(tenantId ? { tenantId } : {}),
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Build date buckets
  const byDate: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    byDate[d.toISOString().split("T")[0]] = 0;
  }
  for (const l of leads) {
    const key = l.createdAt.toISOString().split("T")[0];
    if (key in byDate) byDate[key]++;
  }

  return Object.entries(byDate).map(([date, count]) => ({ date, count }));
}

export async function getLeadSourceBreakdown(tenantId?: string) {
  const leads = await prisma.lead.findMany({
    where: tenantId ? { tenantId } : {},
    select: { sourcePath: true, sourceDomain: true, status: true },
  });

  const bySource: Record<string, { total: number; won: number }> = {};
  for (const l of leads) {
    const key = l.sourcePath ?? "(direct)";
    if (!bySource[key]) bySource[key] = { total: 0, won: 0 };
    bySource[key].total++;
    if (l.status === "WON") bySource[key].won++;
  }

  return Object.entries(bySource)
    .map(([source, data]) => ({ source, ...data, rate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

export async function getContentStats(tenantId?: string) {
  const where = tenantId ? { tenantId } : {};
  const [publishedPages, publishedPosts, totalLeads, leadsByStatusRaw] = await Promise.all([
    prisma.page.count({ where: { ...where, status: "PUBLISHED" } }),
    prisma.post.count({ where: { ...where, status: "PUBLISHED" } }),
    prisma.lead.count({ where }),
    prisma.lead.groupBy({ by: ["status"], where, _count: true }),
  ]);

  const leadsByStatus = Object.fromEntries(leadsByStatusRaw.map((r) => [r.status, r._count]));
  return { publishedPages, publishedPosts, totalLeads, leadsByStatus };
}

export async function getTenantComparison() {
  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    include: { _count: { select: { pages: true, posts: true, leads: true } } },
    orderBy: { name: "asc" },
  });

  const newLeads = await prisma.lead.groupBy({
    by: ["tenantId"],
    where: { status: "NEW" },
    _count: true,
  });
  const wonLeads = await prisma.lead.groupBy({
    by: ["tenantId"],
    where: { status: "WON" },
    _count: true,
  });
  const newMap = Object.fromEntries(newLeads.map((r) => [r.tenantId, r._count]));
  const wonMap = Object.fromEntries(wonLeads.map((r) => [r.tenantId, r._count]));

  return tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    pages: t._count.pages,
    posts: t._count.posts,
    leads: t._count.leads,
    newLeads: newMap[t.id] ?? 0,
    wonLeads: wonMap[t.id] ?? 0,
  }));
}

export async function getMonthlyLeadReport(months = 6, tenantId?: string) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: since },
      ...(tenantId ? { tenantId } : {}),
    },
    select: { createdAt: true, status: true },
  });

  const byMonth: Record<string, { total: number; won: number }> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = { total: 0, won: 0 };
  }
  for (const l of leads) {
    const key = `${l.createdAt.getFullYear()}-${String(l.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (key in byMonth) {
      byMonth[key].total++;
      if (l.status === "WON") byMonth[key].won++;
    }
  }

  return Object.entries(byMonth).map(([month, data]) => ({
    month,
    ...data,
    rate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
  }));
}
