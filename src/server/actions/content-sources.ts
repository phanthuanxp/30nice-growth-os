"use server";

import { revalidatePath } from "next/cache";
import type { ContentSourceType, Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";
import { guessTitleFromUrl, hashContent, normalizeSourceUrl, splitUrlList } from "@/server/content/source-utils";
import { fetchSitemapUrls, fetchRssUrls } from "@/server/content/sitemap-parser";
import { extractArticleFromUrl } from "@/server/content/extractor";
import { rewriteArticleToPost } from "@/server/actions/rewrite-drafts";

export type ActionResult = { ok: boolean; error?: string };

function ensureEditor(role: Role) {
  return can(role, "EDITOR");
}

export async function createContentSourceAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };

  const baseUrl = normalizeSourceUrl(form.get("baseUrl")?.toString() || "");
  const name = form.get("name")?.toString().trim() || baseUrl;
  const tenantId = form.get("tenantId")?.toString() || undefined;
  const sourceType = (form.get("sourceType")?.toString() || "WEBSITE") as ContentSourceType;
  const language = form.get("language")?.toString() || "en";
  const niche = form.get("niche")?.toString() || undefined;
  if (!baseUrl) return { ok: false, error: "Cần URL nguồn" };

  const existing = await prisma.contentSource.findFirst({ where: { tenantId: tenantId ?? null, baseUrl } });
  const source = existing
    ? await prisma.contentSource.update({ where: { id: existing.id }, data: { name, sourceType, language, niche, active: true } })
    : await prisma.contentSource.create({ data: { tenantId, name, baseUrl, sourceType, language, niche, createdById: session.id } });
  await writeAuditLog({ userId: session.id, tenantId, action: "content_source.upsert", resource: "ContentSource", resourceId: source.id, metadata: { baseUrl, sourceType } });
  revalidatePath("/admin/import");
  return { ok: true };
}

export async function importSourceUrlsAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };

  const tenantId = form.get("tenantId")?.toString() || undefined;
  const sourceId = form.get("sourceId")?.toString() || undefined;
  const targetKeyword = form.get("targetKeyword")?.toString() || undefined;
  const urls = splitUrlList(form.get("urls")?.toString() || "").slice(0, 200);
  if (urls.length === 0) return { ok: false, error: "Cần ít nhất một URL bài viết" };

  const job = await prisma.crawlJob.create({ data: { tenantId, sourceId, status: "RUNNING", input: { mode: "manual_url_list", count: urls.length }, startedAt: new Date(), createdById: session.id } });
  let discovered = 0;
  for (const url of urls) {
    const title = guessTitleFromUrl(url);
    await prisma.sourceArticle.upsert({
      where: { url },
      update: { tenantId, sourceId, targetKeyword, title, status: "DISCOVERED" },
      create: { tenantId, sourceId, url, title, targetKeyword, status: "DISCOVERED", contentHash: hashContent(url), metadata: { importedBy: session.id, crawlJobId: job.id } },
    });
    discovered++;
  }
  await prisma.crawlJob.update({ where: { id: job.id }, data: { status: "COMPLETED", discovered, finishedAt: new Date() } });
  await writeAuditLog({ userId: session.id, tenantId, action: "source_articles.import_urls", resource: "CrawlJob", resourceId: job.id, metadata: { discovered } });
  revalidatePath("/admin/import");
  return { ok: true };
}

export async function crawlContentSourceAction(sourceId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };

  const source = await prisma.contentSource.findUnique({ where: { id: sourceId } });
  if (!source) return { ok: false, error: "Không tìm thấy nguồn" };
  if (!["SITEMAP", "RSS"].includes(source.sourceType)) {
    return { ok: false, error: "Chỉ hỗ trợ tự động crawl SITEMAP và RSS" };
  }

  await prisma.contentSource.update({ where: { id: sourceId }, data: { crawlStatus: "RUNNING" } });
  const job = await prisma.crawlJob.create({
    data: {
      tenantId: source.tenantId,
      sourceId,
      status: "RUNNING",
      input: { mode: source.sourceType, url: source.baseUrl },
      startedAt: new Date(),
      createdById: session.id,
    },
  });

  try {
    const discovered =
      source.sourceType === "SITEMAP"
        ? await fetchSitemapUrls(source.baseUrl)
        : await fetchRssUrls(source.baseUrl);

    let added = 0;
    for (const item of discovered) {
      const url = normalizeSourceUrl(item.url);
      if (!url) continue;
      const title = item.title || guessTitleFromUrl(url);
      await prisma.sourceArticle.upsert({
        where: { url },
        update: { sourceId: source.id, tenantId: source.tenantId ?? null },
        create: {
          tenantId: source.tenantId,
          sourceId: source.id,
          url,
          title,
          status: "DISCOVERED",
          contentHash: hashContent(url),
          metadata: { crawlJobId: job.id },
        },
      });
      added++;
    }

    await prisma.crawlJob.update({ where: { id: job.id }, data: { status: "COMPLETED", discovered: added, finishedAt: new Date() } });
    await prisma.contentSource.update({ where: { id: sourceId }, data: { crawlStatus: "COMPLETED", lastCrawledAt: new Date() } });
    await writeAuditLog({ userId: session.id, tenantId: source.tenantId ?? undefined, action: "content_source.crawl", resource: "CrawlJob", resourceId: job.id, metadata: { sourceType: source.sourceType, discovered: added } });
    revalidatePath("/admin/import");
    return { ok: true };
  } catch (e) {
    await prisma.crawlJob.update({ where: { id: job.id }, data: { status: "FAILED", finishedAt: new Date() } });
    await prisma.contentSource.update({ where: { id: sourceId }, data: { crawlStatus: "FAILED" } });
    return { ok: false, error: e instanceof Error ? e.message : "Crawl thất bại" };
  }
}

export type PipelineResult = { ok: boolean; discovered: number; extracted: number; rewrote: number; failed: number; error?: string };

export async function runFullPipelineForSourceAction(sourceId: string): Promise<PipelineResult> {
  const session = await getSession();
  if (!session) return { ok: false, discovered: 0, extracted: 0, rewrote: 0, failed: 0, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, discovered: 0, extracted: 0, rewrote: 0, failed: 0, error: "Không đủ quyền" };

  const source = await prisma.contentSource.findUnique({ where: { id: sourceId } });
  if (!source) return { ok: false, discovered: 0, extracted: 0, rewrote: 0, failed: 0, error: "Nguồn không tồn tại" };

  let discovered = 0;
  let extracted = 0;
  let rewrote = 0;
  let failed = 0;

  // Step 1: Discover URLs from sitemap/RSS
  if (["SITEMAP", "RSS"].includes(source.sourceType)) {
    try {
      const items = source.sourceType === "SITEMAP"
        ? await fetchSitemapUrls(source.baseUrl, 200)
        : await fetchRssUrls(source.baseUrl, 100);
      for (const item of items) {
        const url = normalizeSourceUrl(item.url);
        if (!url) continue;
        await prisma.sourceArticle.upsert({
          where: { url },
          update: {},
          create: { tenantId: source.tenantId, sourceId, url, title: item.title || guessTitleFromUrl(url), status: "DISCOVERED", contentHash: hashContent(url), metadata: { pipeline: true } },
        });
        discovered++;
      }
      await prisma.contentSource.update({ where: { id: sourceId }, data: { crawlStatus: "COMPLETED", lastCrawledAt: new Date() } });
    } catch { /* continue even if crawl fails */ }
  }

  // Step 2: Extract DISCOVERED articles from this source
  const toExtract = await prisma.sourceArticle.findMany({
    where: { sourceId, status: "DISCOVERED" },
    take: 15,
    orderBy: { createdAt: "asc" },
  });
  for (const article of toExtract) {
    try {
      const ex = await extractArticleFromUrl(article.url);
      const dup = await prisma.sourceArticle.findFirst({ where: { contentHash: ex.contentHash, id: { not: article.id } }, select: { id: true } });
      await prisma.sourceArticle.update({ where: { id: article.id }, data: { title: ex.title, canonicalUrl: ex.canonicalUrl, rawHtml: ex.rawHtml, extractedText: ex.extractedText, excerpt: ex.excerpt, imageUrl: ex.imageUrl, contentHash: ex.contentHash, status: dup ? "DUPLICATE" : "READY_FOR_REWRITE", errorMessage: null } });
      extracted++;
    } catch (e) {
      failed++;
      await prisma.sourceArticle.update({ where: { id: article.id }, data: { status: "FAILED", errorMessage: e instanceof Error ? e.message : "Extract failed" } });
    }
  }

  // Step 3: Rewrite READY_FOR_REWRITE articles from this source (only if they have a target tenant)
  const toRewrite = await prisma.sourceArticle.findMany({
    where: { sourceId, status: "READY_FOR_REWRITE", tenantId: { not: null }, extractedText: { not: null } },
    take: 5,
    orderBy: { updatedAt: "asc" },
  });
  for (const article of toRewrite) {
    try {
      await rewriteArticleToPost(article.id, session.id);
      rewrote++;
    } catch {
      failed++;
      await prisma.sourceArticle.update({ where: { id: article.id }, data: { status: "FAILED" } });
    }
  }

  await writeAuditLog({ userId: session.id, tenantId: source.tenantId ?? undefined, action: "content_source.full_pipeline", resource: "ContentSource", resourceId: sourceId, metadata: { discovered, extracted, rewrote, failed } });
  revalidatePath("/admin/import");
  return { ok: true, discovered, extracted, rewrote, failed };
}
