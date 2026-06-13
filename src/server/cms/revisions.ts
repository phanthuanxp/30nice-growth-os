import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

export async function snapshotPageRevision(pageId: string, createdById?: string | null): Promise<void> {
  try {
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) return;

    const last = await prisma.pageRevision.findFirst({
      where: { pageId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    await prisma.pageRevision.create({
      data: {
        tenantId: page.tenantId,
        pageId: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        summary: page.summary,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        ogImageUrl: page.ogImageUrl,
        uiBlocks: page.uiBlocks === null ? Prisma.JsonNull : page.uiBlocks as Prisma.InputJsonValue,
        version: (last?.version ?? 0) + 1,
        createdById: createdById ?? null,
      },
    });
  } catch {
    // Revisions should not block the primary CMS write path.
  }
}

export async function snapshotPostRevision(postId: string, createdById?: string | null): Promise<void> {
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return;

    const last = await prisma.postRevision.findFirst({
      where: { postId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    await prisma.postRevision.create({
      data: {
        tenantId: post.tenantId,
        postId: post.id,
        categoryId: post.categoryId,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage,
        status: post.status,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        ogTitle: post.ogTitle,
        ogDescription: post.ogDescription,
        ogImage: post.ogImage,
        twitterCard: post.twitterCard,
        schemaType: post.schemaType,
        schemaData: post.schemaData,
        robotsMeta: post.robotsMeta,
        canonicalUrl: post.canonicalUrl,
        version: (last?.version ?? 0) + 1,
        createdById: createdById ?? null,
      },
    });
  } catch {
    // Revisions should not block the primary CMS write path.
  }
}
