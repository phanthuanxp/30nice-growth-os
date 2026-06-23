import { prisma } from "@/server/db";

export async function listClusters(projectId: string) {
  return prisma.keywordCluster.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: {
          keyword: { select: { id: true, text: true, searchVolume: true, intent: true } },
        },
      },
      assignedTenant: { select: { id: true, name: true } },
    },
  });
}

export async function getCluster(id: string) {
  return prisma.keywordCluster.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      members: { include: { keyword: true } },
      assignedTenant: { select: { id: true, name: true } },
    },
  });
}

export async function createCluster(
  projectId: string,
  name: string,
  keywordIds: string[],
  headKeyword?: string,
  totalVolume?: number,
) {
  return prisma.keywordCluster.create({
    data: {
      projectId,
      name,
      headKeyword,
      totalVolume: totalVolume ?? 0,
      members: {
        create: keywordIds.map((kwId, idx) => ({
          keywordId: kwId,
          isPrimary: idx === 0,
        })),
      },
    },
    include: { members: { include: { keyword: true } } },
  });
}

export async function deleteCluster(id: string) {
  return prisma.keywordCluster.delete({ where: { id } });
}

export async function deleteClusters(projectId: string) {
  return prisma.keywordCluster.deleteMany({ where: { projectId } });
}

export async function updateClusterName(id: string, name: string) {
  return prisma.keywordCluster.update({ where: { id }, data: { name } });
}

export async function assignClusterToTenant(id: string, assignedTenantId: string) {
  return prisma.keywordCluster.update({ where: { id }, data: { assignedTenantId } });
}
