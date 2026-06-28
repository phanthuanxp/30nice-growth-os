import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { fetchSitemapUrls, fetchRssUrls } from "@/server/content/sitemap-parser";
import { extractArticleFromUrl } from "@/server/content/extractor";
import { rewriteArticleToPost } from "@/server/actions/rewrite-drafts";
import { hashContent, normalizeSourceUrl, guessTitleFromUrl } from "@/server/content/source-utils";

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(req: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  const bearer = req.headers.get("authorization");
  const secret = req.nextUrl.searchParams.get("secret");
  return bearer === `Bearer ${CRON_SECRET}` || secret === CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = { sources: 0, discovered: 0, extracted: 0, rewrote: 0, failed: 0, startedAt: new Date().toISOString() };

  // Step 1: Crawl all active SITEMAP/RSS sources
  const sources = await prisma.contentSource.findMany({
    where: { active: true, sourceType: { in: ["SITEMAP", "RSS"] } },
  });

  for (const source of sources) {
    stats.sources++;
    try {
      const items =
        source.sourceType === "SITEMAP"
          ? await fetchSitemapUrls(source.baseUrl, 200)
          : await fetchRssUrls(source.baseUrl, 100);

      for (const item of items) {
        const url = normalizeSourceUrl(item.url);
        if (!url) continue;
        const exists = await prisma.sourceArticle.findUnique({ where: { url }, select: { id: true } });
        if (!exists) {
          await prisma.sourceArticle.create({
            data: {
              tenantId: source.tenantId,
              sourceId: source.id,
              url,
              title: item.title || guessTitleFromUrl(url),
              status: "DISCOVERED",
              contentHash: hashContent(url),
              metadata: { cronRun: new Date().toISOString() },
            },
          });
          stats.discovered++;
        }
      }
      await prisma.contentSource.update({
        where: { id: source.id },
        data: { lastCrawledAt: new Date(), crawlStatus: "COMPLETED" },
      });
    } catch {
      await prisma.contentSource.update({ where: { id: source.id }, data: { crawlStatus: "FAILED" } });
    }
  }

  // Step 2: Extract up to 30 DISCOVERED articles across all sources
  const toExtract = await prisma.sourceArticle.findMany({
    where: { status: "DISCOVERED" },
    take: 30,
    orderBy: { createdAt: "asc" },
  });

  for (const article of toExtract) {
    try {
      const ex = await extractArticleFromUrl(article.url);
      const dup = await prisma.sourceArticle.findFirst({
        where: { contentHash: ex.contentHash, id: { not: article.id } },
        select: { id: true },
      });
      await prisma.sourceArticle.update({
        where: { id: article.id },
        data: {
          title: ex.title,
          canonicalUrl: ex.canonicalUrl,
          rawHtml: ex.rawHtml,
          extractedText: ex.extractedText,
          excerpt: ex.excerpt,
          imageUrl: ex.imageUrl,
          contentHash: ex.contentHash,
          status: dup ? "DUPLICATE" : "READY_FOR_REWRITE",
          errorMessage: null,
        },
      });
      stats.extracted++;
    } catch (e) {
      stats.failed++;
      await prisma.sourceArticle.update({
        where: { id: article.id },
        data: { status: "FAILED", errorMessage: e instanceof Error ? e.message : "Extract failed" },
      });
    }
  }

  // Step 3: Rewrite up to 10 READY_FOR_REWRITE articles that have a target tenant
  const toRewrite = await prisma.sourceArticle.findMany({
    where: { status: "READY_FOR_REWRITE", tenantId: { not: null }, extractedText: { not: null } },
    take: 10,
    orderBy: { updatedAt: "asc" },
  });

  const systemUserId = (await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true } }))?.id;
  if (systemUserId) {
    for (const article of toRewrite) {
      try {
        await rewriteArticleToPost(article.id, systemUserId);
        stats.rewrote++;
      } catch {
        stats.failed++;
        await prisma.sourceArticle.update({ where: { id: article.id }, data: { status: "FAILED" } });
      }
    }
  }

  return NextResponse.json({ ok: true, ...stats, finishedAt: new Date().toISOString() });
}
