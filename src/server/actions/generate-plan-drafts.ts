"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";
import { scorePostDraft } from "@/server/content/quality-score";

import { generateDraftFromContentPlanItem } from "@/server/content/plan-draft";

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

async function generateForItem(itemId: string, userId: string) {
  const item = await prisma.contentPlanItem.findUnique({ where: { id: itemId }, include: { contentPlan: { include: { tenant: true } } } });
  if (!item) throw new Error("Content plan item not found");
  if (!item.contentPlan.tenantId) throw new Error("Content plan has no target site");
  if (item.postId) return item.postId;
  const draft = await generateDraftFromContentPlanItem({ title: item.title, keyword: item.keyword, intent: item.intent, articleType: item.articleType, siteName: item.contentPlan.tenant?.name, planTitle: item.contentPlan.title });
  const slug = await uniqueSlug(item.contentPlan.tenantId, draft.slug);
  const qualityReport = scorePostDraft({ title: draft.title, content: draft.contentHtml, excerpt: draft.excerpt, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, schemaData: draft.schemaData, keyword: item.keyword });
  const post = await prisma.post.create({ data: { tenantId: item.contentPlan.tenantId, title: draft.title, slug, excerpt: draft.excerpt, content: draft.contentHtml, status: "DRAFT", seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, ogTitle: draft.seoTitle, ogDescription: draft.seoDescription, twitterCard: "summary_large_image", schemaType: "Article", schemaData: draft.schemaData, qualityScore: qualityReport.qualityScore, seoScore: qualityReport.seoScore, qualityReport } });
  await prisma.contentPlanItem.update({ where: { id: item.id }, data: { status: "DRAFT", postId: post.id } });
  await writeAuditLog({ userId, tenantId: item.contentPlan.tenantId, action: "content_plan.generate_draft", resource: "Post", resourceId: post.id, metadata: { contentPlanItemId: item.id } });
  return post.id;
}

export async function generateDraftForContentPlanItemAction(itemId: string, _formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !ensureEditor(session.role)) return;
  const item = await prisma.contentPlanItem.findUnique({ where: { id: itemId }, select: { contentPlan: { select: { tenantId: true } } } }).catch(() => null);
  const tenantId = item?.contentPlan?.tenantId;
  await generateForItem(itemId, session.id).catch(() => null);
  revalidatePath("/admin/publishing");
  if (tenantId) revalidatePath(`/admin/sites/${tenantId}/content-plan`);
}

export async function generateMissingDraftsAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };
  const tenantId = form.get("tenantId")?.toString() || undefined;
  const limit = Math.max(1, Math.min(Number(form.get("limit") || 5), 25));
  const items = await prisma.contentPlanItem.findMany({ where: { postId: null, status: { in: ["PLANNED", "DRAFT"] }, contentPlan: tenantId ? { tenantId } : { tenantId: { not: null } } }, orderBy: [{ priority: "desc" }, { createdAt: "asc" }], take: limit });
  let generated = 0;
  let failed = 0;
  for (const item of items) {
    try { await generateForItem(item.id, session.id); generated++; } catch { failed++; }
  }
  if (tenantId) revalidatePath(`/admin/sites/${tenantId}/content-plan`);
  revalidatePath("/admin/publishing");
  return failed > 0 ? { ok: generated > 0, error: `Generated ${generated}, failed ${failed}` } : { ok: true };
}

export async function addContentPlanItemAction(contentPlanId: string, tenantId: string, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };
  const title = form.get("title")?.toString().trim();
  const keyword = form.get("keyword")?.toString().trim();
  if (!title || !keyword) return { ok: false, error: "Tiêu đề và keyword là bắt buộc" };
  const intent = form.get("intent")?.toString() || "INFORMATIONAL";
  const articleType = form.get("articleType")?.toString() || "travel_guide";
  const priority = Math.min(100, Math.max(0, Number(form.get("priority") || 50)));
  await prisma.contentPlanItem.create({ data: { contentPlanId, title, keyword, intent, articleType, priority } });
  await writeAuditLog({ userId: session.id, tenantId, action: "content_plan.add_item", resource: "ContentPlanItem", metadata: { contentPlanId, title } });
  revalidatePath(`/admin/sites/${tenantId}/content-plan`);
  return { ok: true };
}

export async function createContentPlanAction(tenantId: string, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };
  const title = form.get("title")?.toString().trim() || "Content Plan";
  const existing = await prisma.contentPlan.findFirst({ where: { tenantId } });
  if (existing) return { ok: false, error: "Site này đã có Content Plan" };
  await prisma.contentPlan.create({ data: { tenantId, title, status: "ACTIVE" } });
  await writeAuditLog({ userId: session.id, tenantId, action: "content_plan.create", resource: "ContentPlan", metadata: { title } });
  revalidatePath(`/admin/sites/${tenantId}/content-plan`);
  return { ok: true };
}
