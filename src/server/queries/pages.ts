import { prisma } from "@/server/db";
import type { ContentStatus } from "@prisma/client";

export async function getPagesByTenant(tenantId: string) {
  return prisma.page.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPageBySlug(tenantId: string, slug: string) {
  return prisma.page.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
}

export async function getPageById(id: string) {
  return prisma.page.findUnique({ where: { id } });
}

export type UpsertPageInput = {
  title: string;
  slug: string;
  status?: ContentStatus;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  uiBlocks?: unknown;
};

export async function createPage(tenantId: string, data: UpsertPageInput) {
  return prisma.page.create({
    data: {
      tenantId,
      title: data.title,
      slug: data.slug,
      status: data.status ?? "DRAFT",
      summary: data.summary,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      ogImageUrl: data.ogImageUrl,
      uiBlocks: (data.uiBlocks as object) ?? [],
    },
  });
}

export async function updatePage(id: string, data: Partial<UpsertPageInput>) {
  return prisma.page.update({
    where: { id },
    data: {
      ...data,
      uiBlocks: data.uiBlocks !== undefined ? (data.uiBlocks as object) : undefined,
    },
  });
}

export async function deletePage(id: string) {
  return prisma.page.delete({ where: { id } });
}

export async function countPublishedPages() {
  return prisma.page.count({ where: { status: "PUBLISHED" } });
}

export async function getAllPages() {
  return prisma.page.findMany({
    orderBy: { updatedAt: "desc" },
    include: { tenant: { select: { id: true, name: true, slug: true } } },
  });
}
