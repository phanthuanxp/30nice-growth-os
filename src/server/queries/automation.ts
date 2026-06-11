import { prisma } from "@/server/db";

export const JOB_TYPES: Record<string, string> = {
  seo_check: "Kiểm tra SEO",
  auto_publish: "Tự động đăng bài",
  lead_notify: "Thông báo lead mới",
  wp_import: "Nhập từ WordPress",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ chạy",
  RUNNING: "Đang chạy",
  DONE: "Hoàn thành",
  FAILED: "Lỗi",
};

export type JobPayload = {
  webhookUrl?: string;
  wpBaseUrl?: string;
  lastNotifiedAt?: string;
  lastResult?: {
    runAt: string;
    ok: boolean;
    message: string;
  };
};

export async function getAutomationJobs(tenantId?: string) {
  return prisma.automationJob.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { tenant: { select: { name: true, slug: true } } },
  });
}

export async function createAutomationJob(
  tenantId: string,
  type: string,
  payload?: Partial<JobPayload>
) {
  return prisma.automationJob.create({
    data: { tenantId, type, status: "PENDING", payload: payload ?? {} },
  });
}

export async function updateJobStatus(id: string, status: string, payload?: Partial<JobPayload>) {
  return prisma.automationJob.update({
    where: { id },
    data: {
      status,
      ...(payload !== undefined
        ? {
            payload: payload as object,
          }
        : {}),
    },
  });
}

export async function deleteAutomationJob(id: string) {
  return prisma.automationJob.delete({ where: { id } });
}
