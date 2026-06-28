"use server";

import { revalidatePath } from "next/cache";
import type { ContentSourceType, Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";
import { guessTitleFromUrl, hashContent, normalizeSourceUrl, splitUrlList } from "@/server/content/source-utils";
import { fetchSitemapUrls, fetchRssUrls } from "@/server/content/sitemap-parser";

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
