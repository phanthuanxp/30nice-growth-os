"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";

export type ActionResult = { ok: boolean; error?: string };
function ensureEditor(role: Role) { return can(role, "EDITOR"); }

export async function scheduleContentPlanItemAction(itemId: string, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };
  const raw = form.get("scheduledAt")?.toString();
  if (!raw) return { ok: false, error: "Chọn thời gian" };
  const scheduledAt = new Date(raw);
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, error: "Thời gian không hợp lệ" };
  const item = await prisma.contentPlanItem.update({ where: { id: itemId }, data: { scheduledAt, status: "SCHEDULED" }, include: { contentPlan: true } });
  if (item.postId) {
    await prisma.post.update({ where: { id: item.postId }, data: { status: "DRAFT", publishedAt: scheduledAt } }).catch(() => null);
    await prisma.sourceArticle.updateMany({ where: { draftPostId: item.postId }, data: { status: "SCHEDULED", scheduledPublishAt: scheduledAt, contentPlanItemId: item.id } });
  }
  await writeAuditLog({ userId: session.id, tenantId: item.contentPlan.tenantId || undefined, action: "publishing.schedule_item", resource: "ContentPlanItem", resourceId: itemId, metadata: { scheduledAt } });
  revalidatePath("/admin/publishing");
  return { ok: true };
}

export async function unscheduleContentPlanItemAction(itemId: string): Promise<void> {
  const session = await getSession();
  if (!session || !ensureEditor(session.role)) return;
  const item = await prisma.contentPlanItem.update({ where: { id: itemId }, data: { scheduledAt: null, status: "DRAFT" }, include: { contentPlan: true } });
  if (item.postId) {
    await prisma.sourceArticle.updateMany({ where: { draftPostId: item.postId, status: "SCHEDULED" }, data: { status: "DRAFT_CREATED", scheduledPublishAt: null } });
  }
  await writeAuditLog({ userId: session.id, tenantId: item.contentPlan.tenantId || undefined, action: "publishing.unschedule_item", resource: "ContentPlanItem", resourceId: itemId });
  revalidatePath("/admin/publishing");
}

export async function bulkScheduleContentPlanAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureEditor(session.role)) return { ok: false, error: "Không đủ quyền" };
  const tenantId = form.get("tenantId")?.toString() || undefined;
  const rawStart = form.get("startAt")?.toString();
  const postsPerDay = Math.max(1, Math.min(Number(form.get("postsPerDay") || 3), 20));
  const days = Math.max(1, Math.min(Number(form.get("days") || 14), 90));
  if (!rawStart) return { ok: false, error: "Chọn ngày bắt đầu" };
  const startAt = new Date(rawStart);
  if (Number.isNaN(startAt.getTime())) return { ok: false, error: "Ngày bắt đầu không hợp lệ" };

  const limit = postsPerDay * days;
  const items = await prisma.contentPlanItem.findMany({
    where: { status: { in: ["PLANNED", "DRAFT"] }, contentPlan: tenantId ? { tenantId } : undefined },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: limit,
    include: { contentPlan: true },
  });

  let scheduled = 0;
  for (let i = 0; i < items.length; i++) {
    const dayOffset = Math.floor(i / postsPerDay);
    const slot = i % postsPerDay;
    const scheduledAt = new Date(startAt);
    scheduledAt.setDate(startAt.getDate() + dayOffset);
    scheduledAt.setHours(9 + slot * Math.max(1, Math.floor(8 / postsPerDay)), 0, 0, 0);
    const item = items[i];
    await prisma.contentPlanItem.update({ where: { id: item.id }, data: { status: "SCHEDULED", scheduledAt } });
    if (item.postId) {
      await prisma.post.update({ where: { id: item.postId }, data: { status: "DRAFT", publishedAt: scheduledAt } }).catch(() => null);
      await prisma.sourceArticle.updateMany({ where: { draftPostId: item.postId }, data: { status: "SCHEDULED", scheduledPublishAt: scheduledAt, contentPlanItemId: item.id } });
    }
    scheduled++;
  }
  await writeAuditLog({ userId: session.id, tenantId, action: "publishing.bulk_schedule", resource: "ContentPlanItem", metadata: { scheduled, postsPerDay, days, startAt } });
  revalidatePath("/admin/publishing");
  return { ok: true };
}
