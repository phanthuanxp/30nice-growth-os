import { prisma } from "@/server/db";

export async function getDashboardStats() {
  const [totalSites, publishedPages, publishedPosts, newLeads] =
    await Promise.all([
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.page.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.lead.count({ where: { status: "NEW" } }),
    ]);
  return { totalSites, publishedPages, publishedPosts, newLeads };
}

export async function getTenantsWithCounts() {
  return prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { pages: true, posts: true, leads: true } },
    },
  });
}
