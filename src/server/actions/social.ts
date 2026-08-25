"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireTenantAccess } from "@/server/permissions/guard";
import { writeAuditLog } from "@/server/audit/log";
import { generateSocialPlan, generateSocialStrategy } from "@/server/social/ai";

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

const contentEditSchema = z.object({
  contentId: z.string().min(1),
  topic: z.string().trim().min(5, "Chủ đề quá ngắn").max(240),
  title: z.string().trim().min(5, "Tiêu đề quá ngắn").max(240),
  hook: z.string().trim().max(500).optional(),
  caption: z.string().trim().min(20, "Caption cần ít nhất 20 ký tự").max(5000),
  callToAction: z.string().trim().max(500).optional(),
  hashtags: z.string().trim().max(1000).optional(),
  format: z.enum(["POST", "CAROUSEL", "REEL", "STORY"]),
  scheduledAt: z.string().max(40).optional().refine((value) => !value || !Number.isNaN(new Date(`${value}:00+07:00`).getTime()), "Ngày giờ không hợp lệ"),
  mediaConcept: z.string().trim().max(1200).optional(),
  visualStyle: z.string().trim().max(600).optional(),
  onImageText: z.string().trim().max(240).optional(),
  aspectRatio: z.enum(["1:1", "4:5", "9:16", "16:9"]),
  changeNote: z.string().trim().max(500).optional(),
});

function jsonObject(value: Prisma.JsonValue | null): Record<string, Prisma.JsonValue> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, Prisma.JsonValue>;
  return {};
}

function revalidateSocial() {
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/pages");
  revalidatePath("/admin/social/planner");
  revalidatePath("/admin/social/calendar");
}

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

export async function generateSocialPageStrategyAction(pageId: string): Promise<SocialActionResult> {
  const page = await prisma.socialPage.findUnique({
    where: { id: pageId },
    include: { workspace: { select: { tenantId: true, locale: true } } },
  });
  if (!page) return { ok: false, error: "Không tìm thấy Page" };
  const user = await requireTenantAccess(page.workspace.tenantId, "TENANT_ADMIN");

  try {
    const { strategy, provider } = await generateSocialStrategy({
      pageName: page.name,
      category: page.category || "thương hiệu",
      objective: page.objective || "xây dựng Page bền vững",
      audience: page.targetAudience,
      brandVoice: page.brandVoice,
      locale: page.workspace.locale,
    });
    const currentKit = jsonObject(page.launchKit);
    await prisma.socialPage.update({
      where: { id: page.id },
      data: {
        targetAudience: strategy.audience,
        brandVoice: strategy.brandVoice,
        contentPillars: strategy.pillars,
        postingRules: { approvalRequired: true, maxPostsPerDay: 2, contentRules: strategy.contentRules },
        launchKit: {
          ...currentKit,
          positioning: strategy.positioning,
          promise: strategy.promise,
          description: strategy.description,
          pillars: strategy.pillars,
          visualDirection: strategy.visualDirection,
          usernameSuggestions: strategy.usernameSuggestions,
          aiProvider: provider,
          aiGeneratedAt: new Date().toISOString(),
          approvalMode: "REQUIRED",
        },
        status: "SETUP",
      },
    });
    await writeAuditLog({ userId: user.id, tenantId: page.workspace.tenantId, action: "social.page.ai_strategy", resource: "SocialPage", resourceId: page.id, metadata: { provider } });
    revalidateSocial();
    return { ok: true, id: page.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Không thể tạo chiến lược AI" };
  }
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

export async function generateSocialPlanDraftsAction(planId: string): Promise<SocialActionResult> {
  const contentPlan = await prisma.socialContentPlan.findUnique({
    where: { id: planId },
    include: {
      workspace: { select: { tenantId: true, locale: true } },
      socialPage: true,
      contents: { orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!contentPlan) return { ok: false, error: "Không tìm thấy kế hoạch" };
  if (contentPlan.contents.length !== 30) return { ok: false, error: "Kế hoạch cần đúng 30 nội dung trước khi chạy AI" };
  const user = await requireTenantAccess(contentPlan.workspace.tenantId, "EDITOR");

  try {
    const { plan, provider } = await generateSocialPlan({
      pageName: contentPlan.socialPage.name,
      category: contentPlan.socialPage.category || "thương hiệu",
      objective: contentPlan.socialPage.objective || "xây dựng Page bền vững",
      targetAudience: contentPlan.socialPage.targetAudience,
      brandVoice: contentPlan.socialPage.brandVoice,
      contentPillars: contentPlan.socialPage.contentPillars,
      launchKit: contentPlan.socialPage.launchKit,
      campaignObjective: contentPlan.objective || contentPlan.title,
      language: contentPlan.workspace.locale,
    });
    const sortedItems = [...plan.items].sort((a, b) => a.day - b.day);
    await prisma.$transaction([
      ...contentPlan.contents.map((content, index) => {
        const generated = sortedItems[index];
        return prisma.socialContent.update({
          where: { id: content.id },
          data: {
            pillar: generated.pillar,
            format: generated.format,
            topic: generated.topic,
            title: generated.title,
            hook: generated.hook,
            caption: generated.caption,
            callToAction: generated.callToAction,
            hashtags: generated.hashtags.map((tag) => tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`),
            mediaBrief: generated.mediaBrief,
            status: "DRAFT",
          },
        });
      }),
      prisma.socialContentPlan.update({
        where: { id: contentPlan.id },
        data: {
          status: "ACTIVE",
          strategy: {
            ...plan.strategy,
            durationDays: 30,
            approvalRequired: true,
            timezone: "Asia/Bangkok",
            aiProvider: provider,
            aiGeneratedAt: new Date().toISOString(),
          },
        },
      }),
    ]);
    await writeAuditLog({ userId: user.id, tenantId: contentPlan.workspace.tenantId, action: "social.plan.ai_generate", resource: "SocialContentPlan", resourceId: contentPlan.id, metadata: { provider, items: 30 } });
    revalidateSocial();
    return { ok: true, id: contentPlan.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Không thể tạo kế hoạch AI" };
  }
}

export async function updateSocialContentAction(_prev: SocialActionResult, formData: FormData): Promise<SocialActionResult> {
  const parsed = contentEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const content = await prisma.socialContent.findUnique({
    where: { id: parsed.data.contentId },
    include: { socialPage: { include: { workspace: { select: { tenantId: true } } } }, _count: { select: { revisions: true } } },
  });
  if (!content) return { ok: false, error: "Không tìm thấy nội dung" };
  const user = await requireTenantAccess(content.socialPage.workspace.tenantId, "EDITOR");
  const hashtags = (parsed.data.hashtags || "").split(/[\s,]+/).map((tag) => tag.trim()).filter(Boolean).map((tag) => tag.startsWith("#") ? tag : `#${tag}`);
  const snapshot = JSON.parse(JSON.stringify({
    topic: content.topic,
    title: content.title,
    hook: content.hook,
    caption: content.caption,
    callToAction: content.callToAction,
    hashtags: content.hashtags,
    mediaBrief: content.mediaBrief,
    format: content.format,
    status: content.status,
    scheduledAt: content.scheduledAt?.toISOString() || null,
  })) as Prisma.InputJsonValue;

  await prisma.$transaction([
    prisma.socialContentRevision.create({
      data: {
        socialContentId: content.id,
        version: content._count.revisions + 1,
        snapshot,
        changeNote: parsed.data.changeNote || "Cập nhật nội dung",
        createdById: user.id,
      },
    }),
    prisma.socialContent.update({
      where: { id: content.id },
      data: {
        topic: parsed.data.topic,
        title: parsed.data.title,
        hook: parsed.data.hook || null,
        caption: parsed.data.caption,
        callToAction: parsed.data.callToAction || null,
        hashtags,
        format: parsed.data.format,
        scheduledAt: parsed.data.scheduledAt ? new Date(`${parsed.data.scheduledAt}:00+07:00`) : null,
        mediaBrief: {
          concept: parsed.data.mediaConcept || "",
          visualStyle: parsed.data.visualStyle || "",
          onImageText: parsed.data.onImageText || "",
          aspectRatio: parsed.data.aspectRatio,
        },
        status: "DRAFT",
        approvedAt: null,
        approvedById: null,
      },
    }),
  ]);
  await writeAuditLog({ userId: user.id, tenantId: content.socialPage.workspace.tenantId, action: "social.content.edit", resource: "SocialContent", resourceId: content.id, metadata: { version: content._count.revisions + 1 } });
  revalidateSocial();
  revalidatePath(`/admin/social/planner/${content.id}`);
  return { ok: true, id: content.id };
}

export async function bulkUpdateSocialPlanStatusAction(planId: string, status: "IN_REVIEW" | "APPROVED"): Promise<void> {
  const contentPlan = await prisma.socialContentPlan.findUnique({ where: { id: planId }, include: { workspace: { select: { tenantId: true } } } });
  if (!contentPlan) throw new Error("Không tìm thấy kế hoạch");
  const user = await requireTenantAccess(contentPlan.workspace.tenantId, status === "APPROVED" ? "TENANT_ADMIN" : "EDITOR");
  const eligible = status === "IN_REVIEW" ? ["IDEA", "DRAFT"] as const : ["IN_REVIEW"] as const;
  const result = await prisma.socialContent.updateMany({
    where: { planId, status: { in: [...eligible] } },
    data: { status, approvedAt: status === "APPROVED" ? new Date() : null, approvedById: status === "APPROVED" ? user.id : null },
  });
  await writeAuditLog({ userId: user.id, tenantId: contentPlan.workspace.tenantId, action: "social.plan.bulk_status", resource: "SocialContentPlan", resourceId: planId, metadata: { status, count: result.count } });
  revalidateSocial();
}

export async function scheduleSocialContentAction(contentId: string): Promise<void> {
  const content = await prisma.socialContent.findUnique({ where: { id: contentId }, include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } } });
  if (!content) throw new Error("Không tìm thấy nội dung");
  if (content.status !== "APPROVED") throw new Error("Chỉ bài đã duyệt mới được hẹn lịch");
  if (!content.scheduledAt) throw new Error("Bài chưa có ngày giờ đăng");
  const user = await requireTenantAccess(content.socialPage.workspace.tenantId, "TENANT_ADMIN");
  await prisma.socialContent.update({ where: { id: content.id }, data: { status: "SCHEDULED" } });
  await writeAuditLog({ userId: user.id, tenantId: content.socialPage.workspace.tenantId, action: "social.content.schedule", resource: "SocialContent", resourceId: content.id, metadata: { scheduledAt: content.scheduledAt.toISOString() } });
  revalidateSocial();
}

export async function updateSocialContentStatusAction(contentId: string, status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "SKIPPED"): Promise<void> {
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
