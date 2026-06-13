import { prisma } from "@/server/db";
import type { LeadStatus, Prisma } from "@prisma/client";

export type LeadFilters = {
  status?: LeadStatus;
  search?: string;
  from?: Date;
  to?: Date;
};

export function buildLeadWhere(tenantId?: string, filters?: LeadFilters): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  if (tenantId) where.tenantId = tenantId;
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { message: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.from || filters?.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }
  return where;
}

export async function getLeads(tenantId?: string, filters?: LeadFilters) {
  return prisma.lead.findMany({
    where: buildLeadWhere(tenantId, filters),
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { name: true, slug: true } },
      _count: { select: { activities: true, leadNotes: true, statusHistory: true } },
    },
  });
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      tenant: { select: { name: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      leadNotes: { orderBy: { createdAt: "desc" }, take: 20 },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function updateLeadStatus(id: string, status: LeadStatus, notes?: string, changedById?: string) {
  const existing = await prisma.lead.findUnique({ where: { id }, select: { tenantId: true, status: true } });
  if (!existing) throw new Error("Lead not found");

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      status,
      ...(notes !== undefined ? { notes } : {}),
      lastActivityAt: new Date(),
    },
  });

  await prisma.leadStatusHistory.create({
    data: {
      tenantId: existing.tenantId,
      leadId: id,
      fromStatus: existing.status,
      toStatus: status,
      changedById: changedById ?? null,
      note: notes,
    },
  }).catch(() => null);

  await prisma.leadActivity.create({
    data: {
      tenantId: existing.tenantId,
      leadId: id,
      type: "status_change",
      title: `Đổi trạng thái: ${existing.status} → ${status}`,
      detail: notes,
    },
  }).catch(() => null);

  return updated;
}

export async function getLeadTimeline(leadId: string) {
  const [activities, notes, statuses] = await Promise.all([
    prisma.leadActivity.findMany({ where: { leadId }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.leadNote.findMany({ where: { leadId }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.leadStatusHistory.findMany({ where: { leadId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return { activities, notes, statuses };
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
