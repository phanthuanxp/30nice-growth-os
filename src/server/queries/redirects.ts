import { prisma } from "@/server/db";

export async function listRedirects(tenantId: string) {
  return prisma.redirectRule.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRedirect(id: string, tenantId: string) {
  return prisma.redirectRule.findFirst({ where: { id, tenantId } });
}

export async function getActiveRedirectsForTenant(tenantId: string) {
  return prisma.redirectRule.findMany({
    where: { tenantId, active: true },
    select: { fromPath: true, toPath: true, statusCode: true },
  });
}

export type UpsertRedirectInput = {
  fromPath: string;
  toPath: string;
  statusCode?: number;
  active?: boolean;
  note?: string;
};

export async function createRedirect(tenantId: string, data: UpsertRedirectInput) {
  return prisma.redirectRule.create({
    data: {
      tenantId,
      fromPath: data.fromPath.startsWith("/") ? data.fromPath : `/${data.fromPath}`,
      toPath: data.toPath,
      statusCode: data.statusCode ?? 301,
      active: data.active ?? true,
      note: data.note,
    },
  });
}

export async function updateRedirect(id: string, tenantId: string, data: Partial<UpsertRedirectInput>) {
  return prisma.redirectRule.update({
    where: { id, tenantId },
    data: {
      ...data,
      fromPath: data.fromPath
        ? data.fromPath.startsWith("/") ? data.fromPath : `/${data.fromPath}`
        : undefined,
    },
  });
}

export async function deleteRedirect(id: string, tenantId: string) {
  return prisma.redirectRule.delete({ where: { id, tenantId } });
}

export async function toggleRedirect(id: string, tenantId: string, active: boolean) {
  return prisma.redirectRule.update({ where: { id, tenantId }, data: { active } });
}
