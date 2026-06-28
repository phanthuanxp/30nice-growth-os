"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";
import { scorePostDraft } from "@/server/content/quality-score";
import { rewriteSourceArticle } from "@/server/content/rewrite";
import { attachDraftToContentPlanItem } from "@/server/content/content-plan-linker";
import { fetchRelatedPosts, injectInternalLinks } from "@/server/content/internal-linker";

export type ActionResult = { ok: boolean; error?: string };
function ensureEditor(role: Role) { return can(role, "EDITOR"); }

async function uniqueSlug(tenantId: string, base: string) {
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const exists = await prisma.post.findUnique({ where: { tenantId_slug: { tenantId, slug } }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

// Internal helper used by both server actions and the cron pipeline
export async function rewriteArticleToPost(articleId: string, userId: string): Promise<string | null> {
  const article = await prisma.sourceArticle.findUnique({ where: { id: articleId }, include: { tenant: true } });
  if (!article?.tenantId || !article.extractedText) return null;
  await prisma.sourceArticle.update({ where: { id: articleId }, data: { status: "REWRITE_QUEUED" } });
  const draft = await rewriteSourceArticle({ sourceTitle: article.title, sourceText: article.extractedText, targetKeyword: article.targetKeyword, siteName: article.tenant?.name, canonicalUrl: article.canonicalUrl });
  const slug = await uniqueSlug(article.tenantId, draft.slug);
  // Inject internal links to related published posts from same site
  const relatedPosts = await fetchRelatedPosts(article.tenantId, article.targetKeyword, draft.slug);
  const contentWithLinks = injectInternalLinks(draft.contentHtml, relatedPosts);
  const qualityReport = scorePostDraft({ title: draft.title, content: contentWithLinks, excerpt: draft.excerpt, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, schemaData: draft.schemaData, keyword: article.targetKeyword });
  const post = await prisma.post.create({ data: { tenantId: article.tenantId, title: draft.title, slug, excerpt: draft.excerpt, content: contentWithLinks, featuredImage: article.imageUrl || undefined, status: "DRAFT", seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, ogTitle: draft.seoTitle, ogDescription: draft.seoDescription, ogImage: article.imageUrl || undefined, twitterCard: "summary_large_image", schemaType: "Article", schemaData: draft.schemaData, canonicalUrl: article.canonicalUrl || undefined, qualityScore: qualityReport.qualityScore, seoScore: qualityReport.seoScore, qualityReport } });
  const contentPlanItemId = await attachDraftToContentPlanItem({ tenantId: article.tenantId, sourceArticleId: articleId, postId: post.id, keyword: article.targetKeyword, title: article.title });
  await prisma.sourceArticle.update({ where: { id: articleId }, data: { status: "DRAFT_CREATED", draftPostId: post.id, contentPlanItemId, metadata: { rewrittenAt: new Date().toISOString(), draftPostId: post.id } } });
  await writeAuditLog({ userId, tenantId: article.tenantId, action: "source_article.rewrite_to_draft", resource: "Post", resourceId: post.id, metadata: { sourceArticleId: articleId } });
  return post.id;
}

export async function rewriteSourceArticleToDraftAction(id: string): Promise<void> {
  const session = await getSession();
  if (!session || !ensureEditor(session.role)) return;
  try {
    await rewriteArticleToPost(id, session.id);
  } catch (e) {
    await prisma.sourceArticle.update({ where: { id }, data: { status: "FAILED", errorMessage: e instanceof Error ? e.message : "Rewrite failed" } });
  }
  revalidatePath("/admin/import");
}

export async function rewriteReadyArticlesToDraftsAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };
  const limit = Math.min(Number(form.get("limit") || 3), 10);
  const articles = await prisma.sourceArticle.findMany({ where: { status: "READY_FOR_REWRITE", tenantId: { not: null }, extractedText: { not: null } }, include: { tenant: true }, orderBy: { updatedAt: "asc" }, take: limit });
  let ok = 0, failed = 0;
  for (const article of articles) {
    try {
      await prisma.sourceArticle.update({ where: { id: article.id }, data: { status: "REWRITE_QUEUED" } });
      const draft = await rewriteSourceArticle({ sourceTitle: article.title, sourceText: article.extractedText || "", targetKeyword: article.targetKeyword, siteName: article.tenant?.name, canonicalUrl: article.canonicalUrl });
      const slug = await uniqueSlug(article.tenantId!, draft.slug);
      const qualityReport = scorePostDraft({ title: draft.title, content: draft.contentHtml, excerpt: draft.excerpt, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, schemaData: draft.schemaData, keyword: article.targetKeyword });
      const post = await prisma.post.create({ data: { tenantId: article.tenantId!, title: draft.title, slug, excerpt: draft.excerpt, content: draft.contentHtml, featuredImage: article.imageUrl || undefined, status: "DRAFT", seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, ogTitle: draft.seoTitle, ogDescription: draft.seoDescription, ogImage: article.imageUrl || undefined, twitterCard: "summary_large_image", schemaType: "Article", schemaData: draft.schemaData, canonicalUrl: article.canonicalUrl || undefined, qualityScore: qualityReport.qualityScore, seoScore: qualityReport.seoScore, qualityReport } });
      const contentPlanItemId = await attachDraftToContentPlanItem({ tenantId: article.tenantId!, sourceArticleId: article.id, postId: post.id, keyword: article.targetKeyword, title: article.title });
      await prisma.sourceArticle.update({ where: { id: article.id }, data: { status: "DRAFT_CREATED", draftPostId: post.id, contentPlanItemId, metadata: { rewrittenAt: new Date().toISOString(), draftPostId: post.id, contentPlanItemId } } });
      ok++;
    } catch (e) {
      failed++;
      await prisma.sourceArticle.update({ where: { id: article.id }, data: { status: "FAILED", errorMessage: e instanceof Error ? e.message : "Rewrite failed" } });
    }
  }
  await writeAuditLog({ userId: session.id, action: "source_articles.rewrite_batch", resource: "SourceArticle", metadata: { ok, failed } });
  revalidatePath("/admin/import");
  return { ok: true };
}
