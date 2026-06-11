import { prisma } from "@/server/db";
import type { LeadStatus } from "@prisma/client";

export async function getLeads(tenantId?: string) {
  return prisma.lead.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { tenant: { select: { name: true, slug: true } } },
  });
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: { tenant: { select: { name: true } } },
  });
}

export async function updateLeadStatus(id: string, status: LeadStatus, notes?: string) {
  return prisma.lead.update({
    where: { id },
    data: { status, ...(notes !== undefined ? { notes } : {}) },
  });
}

export async function countNewLeads(tenantId?: string) {
  return prisma.lead.count({
    where: { status: "NEW", ...(tenantId ? { tenantId } : {}) },
  });
}

export async function getLeadStats(tenantId?: string) {
  const where = tenantId ? { tenantId } : {};
  const [total, byStatus] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
  ]);
  const statusMap = Object.fromEntries(byStatus.map((r) => [r.status, r._count]));
  return { total, statusMap };
}
