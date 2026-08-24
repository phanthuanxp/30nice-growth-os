"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireTenantAccess } from "@/server/permissions/guard";
import { writeAuditLog } from "@/server/audit/log";

export type SocialActionResult = { ok: boolean; error?: string; id?: string };

const workspaceSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().trim().min(2, "Tên workspace quá ngắn").max(100),
  objective: z.string().trim().max(500).optional(),
});

const pageSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(2, "Tên Page quá ngắn").max(120),
  category: z.string().trim().min(2, "Cần nhập chủ đề/ngành").max(100),
  objective: z.string().trim().min(3, "Cần nhập mục tiêu").max(500),
  audience: z.string().trim().min(3, "Cần mô tả khách hàng mục tiêu").max(800),
  brandVoice: z.string().trim().min(2).max(300),
});

const planSchema = z.object({
  socialPageId: z.string().min(1),
  title: z.string().trim().min(3, "Tên kế hoạch quá ngắn").max(160),
  objective: z.string().trim().max(500).optional(),
  startDate: z.coerce.date(),
});

const groupSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  groupUrl: z.union([z.literal(""), z.string().url("URL Group không hợp lệ")]).optional(),
  topics: z.string().trim().max(500).optional(),
  rules: z.string().trim().max(2000).optional(),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "social";
}

async function uniqueWorkspaceSlug(tenantId: string, name: string) {
  const base = slugify(name);
  let candidate = base;
  let index = 2;
  while (await prisma.socialWorkspace.findUnique({ where: { tenantId_slug: { tenantId, slug: candidate } }, select: { id: true } })) {
    candidate = `${base}-${index++}`;
  }
  return candidate;
}

async function uniquePageSlug(workspaceId: string, name: string) {
  const base = slugify(name);
  let candidate = base;
  let index = 2;
  while (await prisma.socialPage.findUnique({ where: { workspaceId_slug: { workspaceId, slug: candidate } }, select: { id: true } })) {
    candidate = `${base}-${index++}`;
  }
  return candidate;
}

function launchKit(input: z.infer<typeof pageSchema>) {
  const pillars = [
    { key: "education", label: "Kiến thức hữu ích", ratio: 35 },
    { key: "trust", label: "Niềm tin & câu chuyện thật", ratio: 25 },
    { key: "conversion", label: "Dịch vụ & chuyển đổi", ratio: 25 },
    { key: "engagement", label: "Tương tác cộng đồng", ratio: 15 },
  ];
  return {
    positioning: `${input.name} cung cấp nội dung đáng tin cậy về ${input.category} cho ${input.audience}.`,
    description: `${input.name} — ${input.category}. Theo dõi Page để nhận nội dung hữu ích, cập nhật mới và tư vấn phù hợp.`,
    usernameSuggestion: slugify(input.name).replace(/-/g, ""),
    avatarBrief: `Logo rõ ràng cho ${input.name}, nhận diện tốt ở kích thước nhỏ, phong cách ${input.brandVoice}.`,
    coverBrief: `Ảnh cover Facebook thể hiện ${input.category}, lợi ích chính và CTA liên hệ; phong cách ${input.brandVoice}.`,
    pillars,
    approvalMode: "REQUIRED",
  };
}

const topicTemplates: Record<string, string[]> = {
  education: ["Hướng dẫn cơ bản", "5 điều khách hàng thường hiểu nhầm", "Cách lựa chọn phù hợp", "Kinh nghiệm thực tế", "Giải đáp câu hỏi thường gặp", "Checklist trước khi quyết định", "Mẹo tiết kiệm thời gian"],
  trust: ["Câu chuyện khách hàng", "Một ngày làm việc thực tế", "Quy trình phục vụ", "Đội ngũ đứng sau thương hiệu", "Cam kết chất lượng", "Hình ảnh thực tế"],
  conversion: ["Dịch vụ nổi bật", "Lợi ích khi lựa chọn", "Gói phù hợp từng nhu cầu", "Ưu đãi trong tuần", "Mời nhận tư vấn", "So sánh các lựa chọn"],
  engagement: ["Bạn sẽ chọn phương án nào?", "Câu hỏi cuối tuần", "Chia sẻ trải nghiệm của bạn", "Bình chọn chủ đề tiếp theo", "Tình huống bạn từng gặp"],
};

function build30DayItems(pageName: string, startDate: Date) {
  const sequence = ["education", "trust", "education", "conversion", "engagement", "education", "trust", "conversion"];
  return Array.from({ length: 30 }, (_, index) => {
    const pillar = sequence[index % sequence.length];
    const templates = topicTemplates[pillar];
    const topic = templates[Math.floor(index / sequence.length) % templates.length];
    const scheduledAt = new Date(startDate);
    scheduledAt.setUTCDate(scheduledAt.getUTCDate() + index);
    scheduledAt.setUTCHours(12, 30, 0, 0);
    return {
      socialPageId: "",
      topic: `${topic} — ${pageName}`,
      pillar,
      format: index % 7 === 5 ? "REEL" : index % 5 === 3 ? "CAROUSEL" : "POST",
      title: topic,
      status: "IDEA" as const,
      scheduledAt,
      hashtags: [] as string[],
    };
  });
}

export async function createSocialWorkspaceAction(_prev: SocialActionResult, formData: FormData): Promise<SocialActionResult> {
  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const user = await requireTenantAccess(parsed.data.tenantId, "TENANT_ADMIN");
  const slug = await uniqueWorkspaceSlug(parsed.data.tenantId, parsed.data.name);
  const workspace = await prisma.socialWorkspace.create({
    data: { tenantId: parsed.data.tenantId, name: parsed.data.name, slug, objective: parsed.data.objective || null, status: "ACTIVE" },
  });
  await writeAuditLog({ userId: user.id, tenantId: parsed.data.tenantId, action: "social.workspace.create", resource: "SocialWorkspace", resourceId: workspace.id });
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/pages");
  return { ok: true, id: workspace.id };
}

export async function createSocialPageAction(_prev: SocialActionResult, formData: FormData): Promise<SocialActionResult> {
  const parsed = pageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const workspace = await prisma.socialWorkspace.findUnique({ where: { id: parsed.data.workspaceId }, select: { tenantId: true } });
  if (!workspace) return { ok: false, error: "Không tìm thấy workspace" };
  const user = await requireTenantAccess(workspace.tenantId, "TENANT_ADMIN");
  const slug = await uniquePageSlug(parsed.data.workspaceId, parsed.data.name);
  const kit = launchKit(parsed.data);
  const page = await prisma.socialPage.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      name: parsed.data.name,
      slug,
      category: parsed.data.category,
      objective: parsed.data.objective,
      targetAudience: { summary: parsed.data.audience },
      brandVoice: { summary: parsed.data.brandVoice },
      contentPillars: kit.pillars,
      postingRules: { approvalRequired: true, maxPostsPerDay: 2 },
      launchKit: kit,
    },
  });
  await writeAuditLog({ userId: user.id, tenantId: workspace.tenantId, action: "social.page.create", resource: "SocialPage", resourceId: page.id, metadata: { workspaceId: parsed.data.workspaceId } });
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/pages");
  return { ok: true, id: page.id };
}

export async function createSocialPlanAction(_prev: SocialActionResult, formData: FormData): Promise<SocialActionResult> {
  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const page = await prisma.socialPage.findUnique({
    where: { id: parsed.data.socialPageId },
    include: { workspace: { select: { id: true, tenantId: true } } },
  });
  if (!page) return { ok: false, error: "Không tìm thấy Page" };
  const user = await requireTenantAccess(page.workspace.tenantId, "EDITOR");
  const startDate = parsed.data.startDate;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 29);
  const items = build30DayItems(page.name, startDate).map((item) => ({ ...item, socialPageId: page.id }));
  const plan = await prisma.socialContentPlan.create({
    data: {
      workspaceId: page.workspace.id,
      socialPageId: page.id,
      title: parsed.data.title,
      objective: parsed.data.objective || page.objective,
      startDate,
      endDate,
      status: "DRAFT",
      strategy: { durationDays: 30, approvalRequired: true, timezone: "Asia/Bangkok" },
    },
  });
  await prisma.socialContent.createMany({
    data: items.map((item) => ({ ...item, planId: plan.id })),
  });
  await writeAuditLog({ userId: user.id, tenantId: page.workspace.tenantId, action: "social.plan.create", resource: "SocialContentPlan", resourceId: plan.id, metadata: { socialPageId: page.id, items: 30 } });
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/planner");
  return { ok: true, id: plan.id };
}

export async function updateSocialContentStatusAction(contentId: string, status: "IN_REVIEW" | "APPROVED" | "SKIPPED"): Promise<void> {
  const content = await prisma.socialContent.findUnique({
    where: { id: contentId },
    include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } },
  });
  if (!content) throw new Error("Không tìm thấy nội dung");
  const minRole = status === "IN_REVIEW" ? "EDITOR" : "TENANT_ADMIN";
  const user = await requireTenantAccess(content.socialPage.workspace.tenantId, minRole);
  await prisma.socialContent.update({
    where: { id: contentId },
    data: { status, approvedAt: status === "APPROVED" ? new Date() : null, approvedById: status === "APPROVED" ? user.id : null },
  });
  await writeAuditLog({ userId: user.id, tenantId: content.socialPage.workspace.tenantId, action: "social.content.status", resource: "SocialContent", resourceId: contentId, metadata: { status } });
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/planner");
}

export async function createSocialGroupAction(_prev: SocialActionResult, formData: FormData): Promise<SocialActionResult> {
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const workspace = await prisma.socialWorkspace.findUnique({ where: { id: parsed.data.workspaceId }, select: { tenantId: true } });
  if (!workspace) return { ok: false, error: "Không tìm thấy workspace" };
  const user = await requireTenantAccess(workspace.tenantId, "TENANT_ADMIN");
  const group = await prisma.socialGroup.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      name: parsed.data.name,
      groupUrl: parsed.data.groupUrl || null,
      topics: (parsed.data.topics || "").split(",").map((item) => item.trim()).filter(Boolean),
      rules: parsed.data.rules ? { summary: parsed.data.rules } : undefined,
      mode: "MANUAL_ONLY",
      status: "CANDIDATE",
    },
  });
  await writeAuditLog({ userId: user.id, tenantId: workspace.tenantId, action: "social.group.create", resource: "SocialGroup", resourceId: group.id });
  revalidatePath("/admin/social/groups");
  return { ok: true, id: group.id };
}
