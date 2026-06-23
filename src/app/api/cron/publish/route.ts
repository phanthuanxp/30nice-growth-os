import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";

function authorized(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return process.env.NODE_ENV !== "production";
  return req.headers.get("x-cron-secret") === expected;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const scheduledArticles = await prisma.sourceArticle.findMany({
    where: {
      status: "SCHEDULED",
      scheduledPublishAt: { lte: now },
      draftPostId: { not: null },
    },
    select: { id: true, draftPostId: true, contentPlanItemId: true, scheduledPublishAt: true },
    take: 100,
  });

  const articlePostIds = scheduledArticles.map((a) => a.draftPostId).filter(Boolean) as string[];
  if (articlePostIds.length > 0) {
    await prisma.post.updateMany({
      where: { id: { in: articlePostIds } },
      data: { status: "PUBLISHED" },
    });
    for (const article of scheduledArticles) {
      if (!article.draftPostId) continue;
      await prisma.post.update({
        where: { id: article.draftPostId },
        data: { publishedAt: article.scheduledPublishAt || now },
      }).catch(() => null);
      await prisma.sourceArticle.update({
        where: { id: article.id },
        data: { status: "PUBLISHED" },
      });
      if (article.contentPlanItemId) {
        await prisma.contentPlanItem.update({
          where: { id: article.contentPlanItemId },
          data: { status: "PUBLISHED", postId: article.draftPostId },
        }).catch(() => null);
      }
    }
  }

  const legacyScheduled = await prisma.post.findMany({
    where: {
      status: "DRAFT",
      publishedAt: { lte: now, not: null },
      id: { notIn: articlePostIds },
    },
    select: { id: true, title: true, tenantId: true },
  });

  if (legacyScheduled.length > 0) {
    await prisma.post.updateMany({
      where: { id: { in: legacyScheduled.map((p) => p.id) } },
      data: { status: "PUBLISHED" },
    });
  }

  revalidatePath("/admin/blog");
  revalidatePath("/admin/import");

  return NextResponse.json({
    published: articlePostIds.length + legacyScheduled.length,
    sourceArticles: scheduledArticles.length,
    legacyPosts: legacyScheduled.length,
    posts: legacyScheduled.map((p) => ({ id: p.id, title: p.title })),
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
