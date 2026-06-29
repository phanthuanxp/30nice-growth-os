import { prisma } from "@/server/db";

export async function getDashboardStats() {
  const [totalSites, publishedPages, publishedPosts] = await Promise.all([
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.page.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { totalSites, publishedPages, publishedPosts, newLeads: 0 };
}

export async function getTenantsWithCounts() {
  return prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { pages: true, posts: true } },
    },
  });
}
