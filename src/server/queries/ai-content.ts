import { prisma } from "@/server/db";
import type { AiContentJobStatus, AiContentType } from "@prisma/client";

export async function listAiContentJobs(tenantId: string, limit = 50) {
  return prisma.aiContentJob.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAiContentJob(id: string, tenantId: string) {
  return prisma.aiContentJob.findFirst({ where: { id, tenantId } });
}

export type CreateAiContentJobInput = {
  title: string;
  targetKeyword?: string;
  keywords?: string[];
  contentType?: AiContentType;
  targetLength?: number;
  language?: string;
};

export async function createAiContentJob(
  tenantId: string,
  createdById: string,
  data: CreateAiContentJobInput,
) {
  return prisma.aiContentJob.create({
    data: {
      tenantId,
      createdById,
      title: data.title,
      targetKeyword: data.targetKeyword,
      keywords: data.keywords ?? [],
      contentType: data.contentType ?? "BLOG_POST",
      targetLength: data.targetLength ?? 1000,
      language: data.language ?? "vi",
      status: "PENDING",
    },
  });
}

export async function updateAiContentJob(
  id: string,
  tenantId: string,
  data: Partial<{
    status: AiContentJobStatus;
    brief: object;
    draftHtml: string;
    draftText: string;
    seoTitle: string;
    seoDescription: string;
    pageId: string;
    postId: string;
    errorMessage: string;
  }>,
) {
  return prisma.aiContentJob.update({ where: { id, tenantId }, data });
}

export async function deleteAiContentJob(id: string, tenantId: string) {
  return prisma.aiContentJob.delete({ where: { id, tenantId } });
}

export async function countAiContentJobs(tenantId: string) {
  return prisma.aiContentJob.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: true,
  });
}
