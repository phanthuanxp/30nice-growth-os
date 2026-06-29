"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { prisma } from "@/server/db";
import { runSeoAudit, saveAuditResult } from "@/server/queries/seo";
import {
  createAutomationJob,
  deleteAutomationJob,
  type JobPayload,
} from "@/server/queries/automation";
import { importPagesFromWordPress, importPostsFromWordPress } from "@/server/importers/wordpress";

export type JobFormState = { success?: boolean; error?: string };

export async function createJobAction(
  _prev: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const user = await requireAuth();
  if (!can(user.role, "AGENCY_ADMIN")) return { error: "Không đủ quyền" };

  const tenantId = formData.get("tenantId") as string;
  const type = formData.get("type") as string;
  if (!tenantId || !type) return { error: "Vui lòng chọn site và loại tác vụ" };

  const payload: Partial<JobPayload> = {};
  const webhookUrl = formData.get("webhookUrl") as string;
  const wpBaseUrl = formData.get("wpBaseUrl") as string;
  if (webhookUrl) payload.webhookUrl = webhookUrl;
  if (wpBaseUrl) payload.wpBaseUrl = wpBaseUrl;

  await createAutomationJob(tenantId, type, payload);
  revalidatePath("/admin/automation");
  return { success: true };
}

export async function deleteJobAction(id: string): Promise<{ error?: string }> {
  const user = await requireAuth();
  if (!can(user.role, "AGENCY_ADMIN")) return { error: "Không đủ quyền" };

  await deleteAutomationJob(id);
  revalidatePath("/admin/automation");
  return {};
}

export async function runJobAction(id: string): Promise<{ error?: string; message?: string }> {
  const user = await requireAuth();
  if (!can(user.role, "AGENCY_ADMIN")) return { error: "Không đủ quyền" };

  const job = await prisma.automationJob.findUnique({
    where: { id },
    include: { tenant: true },
  });
  if (!job) return { error: "Không tìm thấy tác vụ" };

  await prisma.automationJob.update({ where: { id }, data: { status: "RUNNING" } });

  try {
    const currentPayload = (job.payload ?? {}) as JobPayload;
    let result: { ok: boolean; message: string } = { ok: true, message: "Hoàn thành" };

    switch (job.type) {
      case "seo_check": {
        const audit = await runSeoAudit(job.tenantId);
        await saveAuditResult(job.tenantId, audit.score, audit.issues);
        result = {
          ok: true,
          message: `Điểm SEO: ${audit.score}/100 · ${audit.issues.length} vấn đề cần xử lý`,
        };
        break;
      }

      case "auto_publish": {
        const now = new Date();
        const scheduled = await prisma.post.findMany({
          where: { tenantId: job.tenantId, status: "DRAFT", publishedAt: { lte: now, not: null } },
          select: { id: true, title: true },
        });
        if (scheduled.length > 0) {
          await prisma.post.updateMany({
            where: { id: { in: scheduled.map((p) => p.id) } },
            data: { status: "PUBLISHED" },
          });
          revalidatePath("/admin/blog");
        }
        result = { ok: true, message: `Đã đăng ${scheduled.length} bài viết lên lịch` };
        break;
      }

      case "lead_notify": {
        result = { ok: false, message: "Tính năng lead_notify đã bị gỡ bỏ" };
        break;
      }

      case "wp_import": {
        if (!currentPayload.wpBaseUrl) {
          result = { ok: false, message: "Chưa cấu hình WordPress URL" };
          break;
        }
        const [pagesResult, postsResult] = await Promise.all([
          importPagesFromWordPress(job.tenantId, currentPayload.wpBaseUrl),
          importPostsFromWordPress(job.tenantId, currentPayload.wpBaseUrl),
        ]);
        revalidatePath("/admin/pages");
        revalidatePath("/admin/blog");
        result = {
          ok: pagesResult.ok && postsResult.ok,
          message: `Trang: ${pagesResult.imported} nhập · Bài: ${postsResult.imported} nhập · Bỏ qua: ${pagesResult.skipped + postsResult.skipped}`,
        };
        break;
      }

      default:
        result = { ok: false, message: `Loại tác vụ chưa hỗ trợ: ${job.type}` };
    }

    const updatedPayload: JobPayload = {
      ...currentPayload,
      lastResult: { runAt: new Date().toISOString(), ...result },
      ...(job.type === "lead_notify" && result.ok
        ? { lastNotifiedAt: new Date().toISOString() }
        : {}),
    };

    await prisma.automationJob.update({
      where: { id },
      data: { status: result.ok ? "DONE" : "FAILED", payload: updatedPayload as object },
    });
    revalidatePath("/admin/automation");
    return { message: result.message };
  } catch (e) {
    await prisma.automationJob.update({ where: { id }, data: { status: "FAILED" } });
    revalidatePath("/admin/automation");
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" };
  }
}
