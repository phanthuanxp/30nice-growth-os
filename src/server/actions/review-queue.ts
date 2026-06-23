"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";

export type ActionResult = { ok: boolean; error?: string };
function ensureEditor(role: Role) { return can(role, "EDITOR"); }
async function loadArticleWithDraft(id: string) { return prisma.sourceArticle.findUnique({ where: { id }, include: { tenant: true } }); }

export async function publishDraftFromReviewAction(id: string): Promise<void> {
  const session = await getSession();
  if (!session || !ensureEditor(session.role)) return;
  const article = await loadArticleWithDraft(id);
  if (!article?.draftPostId) return;
  const post = await prisma.post.update({ where: { id: article.draftPostId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  await prisma.sourceArticle.update({ where: { id }, data: { status: "PUBLISHED", reviewedAt: new Date(), reviewedById: session.id } });
  if (article.contentPlanItemId) await prisma.contentPlanItem.update({ where: { id: article.contentPlanItemId }, data: { status: "PUBLISHED", postId: post.id } }).catch(() => null);
  await writeAuditLog({ userId: session.id, tenantId: article.tenantId || undefined, action: "review_queue.publish", resource: "Post", resourceId: post.id, metadata: { sourceArticleId: id } });
  revalidatePath("/admin/import");
}

export async function scheduleDraftFromReviewAction(id: string, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };
  const article = await loadArticleWithDraft(id);
  if (!article?.draftPostId) return { ok: false, error: "Không có draft post" };
  const raw = form.get("scheduledAt")?.toString();
  if (!raw) return { ok: false, error: "Chọn thời gian publish" };
  const scheduledAt = new Date(raw);
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, error: "Thời gian không hợp lệ" };
  await prisma.post.update({ where: { id: article.draftPostId }, data: { status: "DRAFT", publishedAt: scheduledAt } });
  await prisma.sourceArticle.update({ where: { id }, data: { status: "SCHEDULED", scheduledPublishAt: scheduledAt, reviewedAt: new Date(), reviewedById: session.id } });
  if (article.contentPlanItemId) await prisma.contentPlanItem.update({ where: { id: article.contentPlanItemId }, data: { status: "SCHEDULED", scheduledAt, postId: article.draftPostId } }).catch(() => null);
  await writeAuditLog({ userId: session.id, tenantId: article.tenantId || undefined, action: "review_queue.schedule", resource: "Post", resourceId: article.draftPostId, metadata: { sourceArticleId: id, scheduledAt } });
  revalidatePath("/admin/import");
  return { ok: true };
}

export async function rejectDraftFromReviewAction(id: string): Promise<void> {
  const session = await getSession();
  if (!session || !ensureEditor(session.role)) return;
  const article = await loadArticleWithDraft(id);
  if (!article) return;
  await prisma.sourceArticle.update({ where: { id }, data: { status: "READY_FOR_REWRITE", reviewedAt: new Date(), reviewedById: session.id } });
  await writeAuditLog({ userId: session.id, tenantId: article.tenantId || undefined, action: "review_queue.reject", resource: "SourceArticle", resourceId: id });
  revalidatePath("/admin/import");
}

export async function publishDueScheduledPostsAction(): Promise<{ ok: boolean; published: number }> {
  const now = new Date();
  const due = await prisma.sourceArticle.findMany({ where: { status: "SCHEDULED", scheduledPublishAt: { lte: now }, draftPostId: { not: null } }, take: 25 });
  let published = 0;
  for (const article of due) {
    if (!article.draftPostId) continue;
    await prisma.post.update({ where: { id: article.draftPostId }, data: { status: "PUBLISHED", publishedAt: article.scheduledPublishAt || now } });
    await prisma.sourceArticle.update({ where: { id: article.id }, data: { status: "PUBLISHED" } });
    published++;
  }
  return { ok: true, published };
}
