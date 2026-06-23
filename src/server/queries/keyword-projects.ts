import { prisma } from "@/server/db";
import type { KeywordProjectStatus } from "@prisma/client";

export async function listKeywordProjects(ownerId: string) {
  return prisma.keywordProject.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { keywords: true, clusters: true } },
    },
  });
}

export async function getKeywordProject(id: string, ownerId: string) {
  return prisma.keywordProject.findFirst({
    where: { id, ownerId },
    include: {
      _count: { select: { keywords: true, clusters: true } },
    },
  });
}

export async function getKeywordProjectWithData(id: string, ownerId: string) {
  return prisma.keywordProject.findFirst({
    where: { id, ownerId },
    include: {
      keywords: { orderBy: [{ searchVolume: "desc" }, { text: "asc" }] },
      clusters: {
        orderBy: { createdAt: "desc" },
        include: {
          members: {
            include: { keyword: { select: { id: true, text: true, searchVolume: true, intent: true } } },
          },
          assignedTenant: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
}

export type CreateKeywordProjectInput = {
  name: string;
  description?: string;
  language?: string;
  country?: string;
  niche?: string;
};

export async function createKeywordProject(ownerId: string, data: CreateKeywordProjectInput) {
  return prisma.keywordProject.create({
    data: { ...data, ownerId },
  });
}

export async function updateKeywordProject(
  id: string,
  ownerId: string,
  data: Partial<CreateKeywordProjectInput> & { status?: KeywordProjectStatus },
) {
  return prisma.keywordProject.update({
    where: { id, ownerId },
    data,
  });
}

export async function deleteKeywordProject(id: string, ownerId: string) {
  return prisma.keywordProject.delete({ where: { id, ownerId } });
}
