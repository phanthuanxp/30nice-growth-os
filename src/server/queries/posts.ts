import { prisma } from "@/server/db";
import type { ContentStatus } from "@prisma/client";

export async function getPostsByTenant(tenantId: string) {
  return prisma.post.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
}

export async function getPublishedPostsByTenant(tenantId: string) {
  return prisma.post.findMany({
    where: { tenantId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { category: true },
  });
}

export async function getPostBySlug(tenantId: string, slug: string) {
  return prisma.post.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    include: { category: true },
  });
}

export async function getPostById(id: string) {
  return prisma.post.findUnique({ where: { id }, include: { category: true } });
}

export async function getCategoriesByTenant(tenantId: string) {
  return prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export type UpsertPostInput = {
  title: string;
  slug: string;
  status?: ContentStatus;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  schemaType?: string;
  schemaData?: string;
  robotsMeta?: string;
  canonicalUrl?: string;
  publishedAt?: Date | null;
  categoryId?: string | null;
};

export async function createPost(tenantId: string, data: UpsertPostInput) {
  return prisma.post.create({
    data: {
      tenantId,
      title: data.title,
      slug: data.slug,
      status: data.status ?? "DRAFT",
      excerpt: data.excerpt,
      content: data.content ?? "",
      featuredImage: data.featuredImage,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImage: data.ogImage,
      twitterCard: data.twitterCard,
      schemaType: data.schemaType,
      schemaData: data.schemaData,
      robotsMeta: data.robotsMeta,
      canonicalUrl: data.canonicalUrl,
      publishedAt: data.status === "PUBLISHED" ? (data.publishedAt ?? new Date()) : null,
      categoryId: data.categoryId,
    },
  });
}

export async function updatePost(id: string, data: Partial<UpsertPostInput>) {
  return prisma.post.update({ where: { id }, data });
}

export async function deletePost(id: string) {
  return prisma.post.delete({ where: { id } });
}

export async function countPublishedPosts() {
  return prisma.post.count({ where: { status: "PUBLISHED" } });
}

export async function getAllPosts() {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      category: true,
    },
  });
}
