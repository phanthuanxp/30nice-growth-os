"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";
import { extractArticleFromUrl } from "@/server/content/extractor";

export type ActionResult = { ok: boolean; error?: string };
function ensureEditor(role: Role) { return can(role, "EDITOR"); }

export async function extractSourceArticleAction(id: string): Promise<void> {
  const session = await getSession();
  if (!session || !ensureEditor(session.role)) return;
  const article = await prisma.sourceArticle.findUnique({ where: { id } });
  if (!article) return;
  try {
    const extracted = await extractArticleFromUrl(article.url);
    const duplicate = await prisma.sourceArticle.findFirst({ where: { contentHash: extracted.contentHash, id: { not: id } }, select: { id: true } });
    await prisma.sourceArticle.update({
      where: { id },
      data: { title: extracted.title, canonicalUrl: extracted.canonicalUrl, rawHtml: extracted.rawHtml, extractedText: extracted.extractedText, excerpt: extracted.excerpt, imageUrl: extracted.imageUrl, contentHash: extracted.contentHash, status: duplicate ? "DUPLICATE" : "READY_FOR_REWRITE", errorMessage: null, metadata: { extractedAt: new Date().toISOString(), duplicateOf: duplicate?.id } },
    });
    await writeAuditLog({ userId: session.id, tenantId: article.tenantId || undefined, action: "source_article.extract", resource: "SourceArticle", resourceId: id, metadata: { duplicate: Boolean(duplicate) } });
  } catch (e) {
    await prisma.sourceArticle.update({ where: { id }, data: { status: "FAILED", errorMessage: e instanceof Error ? e.message : "Extract failed" } });
  }
  revalidatePath("/admin/import");
}

export async function extractPendingArticlesAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };
  const limit = Math.min(Number(form.get("limit") || 5), 20);
  const articles = await prisma.sourceArticle.findMany({ where: { status: "DISCOVERED" }, take: limit, orderBy: { createdAt: "asc" } });
  let ok = 0;
  let failed = 0;
  for (const article of articles) {
    try {
      const extracted = await extractArticleFromUrl(article.url);
      const duplicate = await prisma.sourceArticle.findFirst({ where: { contentHash: extracted.contentHash, id: { not: article.id } }, select: { id: true } });
      await prisma.sourceArticle.update({ where: { id: article.id }, data: { title: extracted.title, canonicalUrl: extracted.canonicalUrl, rawHtml: extracted.rawHtml, extractedText: extracted.extractedText, excerpt: extracted.excerpt, imageUrl: extracted.imageUrl, contentHash: extracted.contentHash, status: duplicate ? "DUPLICATE" : "READY_FOR_REWRITE", errorMessage: null, metadata: { extractedAt: new Date().toISOString(), duplicateOf: duplicate?.id } } });
      ok++;
    } catch (e) {
      failed++;
      await prisma.sourceArticle.update({ where: { id: article.id }, data: { status: "FAILED", errorMessage: e instanceof Error ? e.message : "Extract failed" } });
    }
  }
  await writeAuditLog({ userId: session.id, action: "source_articles.extract_batch", resource: "SourceArticle", metadata: { ok, failed } });
  revalidatePath("/admin/import");
  return { ok: true };
}
