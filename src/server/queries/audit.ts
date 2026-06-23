import { prisma } from "@/server/db";

export interface AuditLogFilters {
  userId?: string;
  tenantId?: string;
  action?: string;
  from?: Date;
  to?: Date;
  search?: string;
  limit?: number;
  cursor?: string;
}

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const limit = Math.min(filters.limit ?? 50, 200);
  const where: Record<string, unknown> = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.action) where.action = { contains: filters.action, mode: "insensitive" };
  if (filters.search) {
    const s = filters.search.trim();
    if (s) {
      where.OR = [
        { action: { contains: s, mode: "insensitive" } },
        { resource: { contains: s, mode: "insensitive" } },
        { resourceId: { contains: s, mode: "insensitive" } },
      ];
    }
  }
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, email: true, name: true } },
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function countAuditLogs(filters: Pick<AuditLogFilters, "userId" | "tenantId" | "action"> = {}) {
  const where: Record<string, unknown> = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.action) where.action = { contains: filters.action, mode: "insensitive" };
  return prisma.auditLog.count({ where });
}

export async function distinctAuditActions(): Promise<string[]> {
  const rows = await prisma.auditLog.groupBy({
    by: ["action"],
    orderBy: { action: "asc" },
    take: 100,
  });
  return rows.map((r) => r.action);
}
