"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireTenantAccess } from "@/server/permissions/guard";
import { writeAuditLog } from "@/server/audit/log";
import { decryptToken } from "@/server/crypto/token-vault";
import { getMetaGroup } from "@/server/meta/client";
import { generateGroupCaptionVariants, type GroupCaptionBrief } from "@/server/social/ai";
import {
  DEFAULT_GROUP_SPACING_MINUTES,
  evaluateGroupDistribution,
  findDuplicateCaptionGroups,
  resolveGroupPublishRoute,
  sanitizeGroupCaption,
  shouldClearApiVerification,
  staggerGroupSchedule,
  startOfDayInOffset,
  timezoneOffsetHours,
  type GroupRuleSnapshot,
} from "@/server/social/group-rules";

export type SocialGroupResult = { ok: boolean; error?: string; id?: string };

export interface GroupDistributionResult {
  ok: boolean;
  error?: string;
  created?: number;
  /** Groups left out of the queue, with the guardrail that stopped them. */
  skipped?: { group: string; reason: string }[];
  warnings?: string[];
}

const groupEditSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  groupUrl: z.union([z.literal(""), z.string().url("URL Group không hợp lệ")]).optional(),
  externalGroupId: z.string().trim().max(64).optional(),
  topics: z.string().trim().max(500).optional(),
  rules: z.string().trim().max(2000).optional(),
  dailyPostLimit: z.coerce.number().int().min(0).max(20),
  cooldownHours: z.coerce.number().int().min(0).max(720),
  allowLinks: z.union([z.literal("on"), z.literal("")]).optional(),
  allowPromotion: z.union([z.literal("on"), z.literal("")]).optional(),
});

const distributionSchema = z.object({
  contentId: z.string().min(1),
  groupIds: z.array(z.string().min(1)).min(1, "Chọn ít nhất một Group").max(20, "Tối đa 20 Group mỗi lần"),
  spacingMinutes: z.coerce.number().int().min(5).max(720).default(DEFAULT_GROUP_SPACING_MINUTES),
});

const markPostedSchema = z.object({
  targetId: z.string().min(1),
  postUrl: z.union([z.literal(""), z.string().url("URL bài đăng không hợp lệ")]).optional(),
});

function revalidateGroups(contentId?: string) {
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/groups");
  revalidatePath("/admin/social/publishing");
  if (contentId) revalidatePath(`/admin/social/planner/${contentId}`);
}

function parseTopics(value: string | undefined): string[] {
  return (value || "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20);
}

function rulesSummary(rules: Prisma.JsonValue | null): string | null {
  if (rules && typeof rules === "object" && !Array.isArray(rules)) {
    const summary = (rules as Record<string, unknown>).summary;
    if (typeof summary === "string" && summary.trim()) return summary.trim();
  }
  return null;
}

type GroupRow = {
  id: string;
  name: string;
  status: GroupRuleSnapshot["status"];
  mode: GroupRuleSnapshot["mode"];
  topics: string[];
  dailyPostLimit: number;
  cooldownHours: number;
  allowLinks: boolean;
  allowPromotion: boolean;
  apiVerifiedAt: Date | null;
};

function snapshot(group: GroupRow): GroupRuleSnapshot {
  return {
    id: group.id,
    name: group.name,
    status: group.status,
    mode: group.mode,
    topics: group.topics,
    dailyPostLimit: group.dailyPostLimit,
    cooldownHours: group.cooldownHours,
    allowLinks: group.allowLinks,
    allowPromotion: group.allowPromotion,
    apiVerifiedAt: group.apiVerifiedAt,
  };
}

async function loadGroupForAdmin(groupId: string, minRole: "TENANT_ADMIN" | "EDITOR" = "TENANT_ADMIN") {
  const group = await prisma.socialGroup.findUnique({
    where: { id: groupId },
    include: { workspace: { select: { id: true, tenantId: true } } },
  });
  if (!group) throw new Error("Không tìm thấy Group");
  const user = await requireTenantAccess(group.workspace.tenantId, minRole);
  return { group, user };
}

export async function updateSocialGroupAction(_previous: SocialGroupResult, formData: FormData): Promise<SocialGroupResult> {
  const parsed = groupEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  try {
    const { group, user } = await loadGroupForAdmin(parsed.data.groupId);
    const nextExternalGroupId = parsed.data.externalGroupId || null;
    // Verification is proof about one specific group id. Re-point the record and
    // the proof is void, so it is dropped rather than carried over to a group
    // whose access was never checked. Pending API targets need no separate
    // handling: the publisher re-resolves the route and parks them as manual.
    const clearVerification = shouldClearApiVerification(group.externalGroupId, nextExternalGroupId);
    await prisma.socialGroup.update({
      where: { id: group.id },
      data: {
        name: parsed.data.name,
        groupUrl: parsed.data.groupUrl || null,
        externalGroupId: nextExternalGroupId,
        topics: parseTopics(parsed.data.topics),
        rules: parsed.data.rules ? { summary: parsed.data.rules } : Prisma.JsonNull,
        dailyPostLimit: parsed.data.dailyPostLimit,
        cooldownHours: parsed.data.cooldownHours,
        allowLinks: parsed.data.allowLinks === "on",
        allowPromotion: parsed.data.allowPromotion === "on",
        ...(clearVerification ? { apiVerifiedAt: null } : {}),
      },
    });
    await writeAuditLog({ userId: user.id, tenantId: group.workspace.tenantId, action: "social.group.update", resource: "SocialGroup", resourceId: group.id, metadata: { clearedApiVerification: clearVerification } });
    revalidateGroups();
    return { ok: true, id: group.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Không thể cập nhật Group" };
  }
}

export async function setSocialGroupStatusAction(groupId: string, status: "APPROVED" | "PAUSED" | "REJECTED", reason?: string): Promise<void> {
  const { group, user } = await loadGroupForAdmin(groupId);
  await prisma.socialGroup.update({
    where: { id: group.id },
    data: {
      status,
      statusReason: reason?.slice(0, 500) || null,
      approvedAt: status === "APPROVED" ? new Date() : null,
      approvedById: status === "APPROVED" ? user.id : null,
    },
  });
  if (status !== "APPROVED") {
    // A group that lost its approval must not keep queued posts waiting.
    await prisma.socialPublishTarget.updateMany({
      where: { socialGroupId: group.id, status: { in: ["DRAFT", "PENDING_APPROVAL", "SCHEDULED", "MANUAL_REQUIRED"] } },
      data: { status: "SKIPPED", errorMessage: `Group chuyển sang trạng thái ${status}`, lockedAt: null, lockToken: null },
    });
  }
  await writeAuditLog({ userId: user.id, tenantId: group.workspace.tenantId, action: "social.group.status", resource: "SocialGroup", resourceId: group.id, metadata: { status } });
  revalidateGroups();
}

export async function setSocialGroupModeAction(groupId: string, mode: "MANUAL_ONLY" | "API_ALLOWED" | "DISABLED"): Promise<void> {
  const { group, user } = await loadGroupForAdmin(groupId);
  // API mode is only meaningful once the token was actually checked against the
  // group; without that stamp the publisher would route back to manual anyway.
  if (mode === "API_ALLOWED" && !group.apiVerifiedAt) {
    throw new Error("Cần xác minh quyền API với Group này trước khi bật chế độ API");
  }
  await prisma.socialGroup.update({ where: { id: group.id }, data: { mode } });
  await writeAuditLog({ userId: user.id, tenantId: group.workspace.tenantId, action: "social.group.mode", resource: "SocialGroup", resourceId: group.id, metadata: { mode } });
  revalidateGroups();
}

export async function verifySocialGroupApiAccessAction(groupId: string): Promise<SocialGroupResult> {
  try {
    const { group, user } = await loadGroupForAdmin(groupId);
    if (!group.externalGroupId) return { ok: false, error: "Cần nhập Facebook Group ID trước khi xác minh" };

    const connection = await prisma.socialConnection.findFirst({
      where: { socialPage: { workspaceId: group.workspaceId }, connectionStatus: "CONNECTED" },
      orderBy: { lastValidatedAt: "desc" },
    });
    if (!connection) return { ok: false, error: "Workspace chưa có Facebook Page nào kết nối hợp lệ" };

    await getMetaGroup(group.externalGroupId, decryptToken(connection.encryptedToken));
    await prisma.socialGroup.update({ where: { id: group.id }, data: { apiVerifiedAt: new Date() } });
    await writeAuditLog({ userId: user.id, tenantId: group.workspace.tenantId, action: "social.group.api_verified", resource: "SocialGroup", resourceId: group.id, metadata: { externalGroupId: group.externalGroupId } });
    revalidateGroups();
    return { ok: true, id: group.id };
  } catch (error) {
    // Verification failing is the normal outcome without app review; leave the
    // group on the manual path and surface why.
    return { ok: false, error: error instanceof Error ? error.message : "Không xác minh được quyền API với Group" };
  }
}

export async function buildGroupDistributionQueueAction(_previous: GroupDistributionResult, formData: FormData): Promise<GroupDistributionResult> {
  const parsed = distributionSchema.safeParse({
    contentId: formData.get("contentId"),
    groupIds: formData.getAll("groupIds"),
    spacingMinutes: formData.get("spacingMinutes") || DEFAULT_GROUP_SPACING_MINUTES,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const content = await prisma.socialContent.findUnique({
    where: { id: parsed.data.contentId },
    include: {
      socialPage: {
        include: {
          connection: { select: { grantedScopes: true, connectionStatus: true } },
          workspace: { select: { id: true, tenantId: true, timezone: true, locale: true } },
        },
      },
    },
  });
  if (!content) return { ok: false, error: "Không tìm thấy nội dung" };

  const { workspace } = content.socialPage;
  let user;
  try {
    user = await requireTenantAccess(workspace.tenantId, "TENANT_ADMIN");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Không đủ quyền" };
  }

  if (!["APPROVED", "SCHEDULED", "PUBLISHED"].includes(content.status)) {
    return { ok: false, error: "Chỉ phân phối vào Group sau khi nội dung đã được duyệt" };
  }

  // Scoping the lookup to the content's own workspace is what stops a group id
  // from another tenant being smuggled in through the form.
  const groups = await prisma.socialGroup.findMany({
    where: { id: { in: parsed.data.groupIds }, workspaceId: workspace.id },
    select: {
      id: true, name: true, status: true, mode: true, topics: true, dailyPostLimit: true,
      cooldownHours: true, allowLinks: true, allowPromotion: true, apiVerifiedAt: true, rules: true,
      externalGroupId: true,
    },
  });
  if (groups.length === 0) return { ok: false, error: "Không tìm thấy Group hợp lệ trong workspace này" };

  // A group already posted for this content must not be rebuilt: the upsert
  // below would reset a PUBLISHED row back to the queue and lose the record.
  const alreadyPublished = new Set(
    (await prisma.socialPublishTarget.findMany({
      where: { socialContentId: content.id, targetType: "GROUP", status: "PUBLISHED" },
      select: { socialGroupId: true },
    })).flatMap((row) => (row.socialGroupId ? [row.socialGroupId] : [])),
  );

  const now = new Date();
  const offset = timezoneOffsetHours(workspace.timezone, now);
  const dayStart = startOfDayInOffset(now, offset);

  const [todayCounts, lastPosts] = await Promise.all([
    prisma.socialPublishTarget.groupBy({
      by: ["socialGroupId"],
      where: { socialGroupId: { in: groups.map((group) => group.id) }, status: "PUBLISHED", publishedAt: { gte: dayStart } },
      _count: { _all: true },
    }),
    prisma.socialPublishTarget.findMany({
      where: { socialGroupId: { in: groups.map((group) => group.id) }, status: "PUBLISHED", publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: { socialGroupId: true, publishedAt: true },
    }),
  ]);
  const postsToday = new Map(todayCounts.map((row) => [row.socialGroupId, row._count._all]));
  const lastPostedAt = new Map<string, Date>();
  for (const row of lastPosts) {
    if (row.socialGroupId && row.publishedAt && !lastPostedAt.has(row.socialGroupId)) {
      lastPostedAt.set(row.socialGroupId, row.publishedAt);
    }
  }

  const contentTopics = [content.topic, content.title, content.pillar].filter((value): value is string => Boolean(value));
  const skipped: { group: string; reason: string }[] = [];
  const warnings: string[] = [];
  const eligible: typeof groups = [];

  for (const group of groups) {
    if (alreadyPublished.has(group.id)) {
      skipped.push({ group: group.name, reason: "Bài này đã được đăng vào Group" });
      continue;
    }
    const verdict = evaluateGroupDistribution({
      group: snapshot(group),
      activity: { postsToday: postsToday.get(group.id) ?? 0, lastPostedAt: lastPostedAt.get(group.id) ?? null },
      contentTopics,
      now,
    });
    if (!verdict.allowed) {
      skipped.push({ group: group.name, reason: verdict.reason ?? "Không đủ điều kiện phân phối" });
      continue;
    }
    verdict.warnings.forEach((warning) => warnings.push(`${group.name}: ${warning}`));
    eligible.push(group);
  }
  if (eligible.length === 0) return { ok: false, error: "Không Group nào đủ điều kiện lúc này", skipped };

  const briefs: GroupCaptionBrief[] = eligible.map((group) => ({
    id: group.id,
    name: group.name,
    topics: group.topics,
    rules: rulesSummary(group.rules),
    allowLinks: group.allowLinks,
    allowPromotion: group.allowPromotion,
  }));

  let variants;
  let provider: string;
  try {
    const generated = await generateGroupCaptionVariants({
      content: {
        topic: content.topic,
        title: content.title,
        caption: content.caption,
        callToAction: content.callToAction,
        hashtags: content.hashtags,
      },
      pageName: content.socialPage.name,
      groups: briefs,
      language: workspace.locale,
    });
    variants = generated.variants;
    provider = generated.provider;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Không tạo được caption biến thể", skipped };
  }

  const byGroup = new Map(variants.map((variant) => [variant.groupId, variant]));
  const prepared = eligible.map((group) => {
    const variant = byGroup.get(group.id);
    const sanitized = sanitizeGroupCaption(variant?.caption ?? "", group);
    if (sanitized.removed.length) {
      warnings.push(`${group.name}: đã tự động gỡ ${sanitized.removed.join(" và ")} theo quy tắc Group`);
    }
    return { group, caption: sanitized.caption, angle: variant?.angle ?? null };
  });

  const empty = prepared.find((entry) => entry.caption.trim().length < 40);
  if (empty) return { ok: false, error: `Caption cho "${empty.group.name}" quá ngắn sau khi lọc theo quy tắc Group`, skipped, warnings };

  // Posting identical text across groups is exactly what gets an account
  // flagged, so a collision fails the whole batch rather than posting anyway.
  const duplicates = findDuplicateCaptionGroups(prepared.map((entry) => ({ groupId: entry.group.id, caption: entry.caption })));
  if (duplicates.length) {
    const names = duplicates[0].map((id) => prepared.find((entry) => entry.group.id === id)?.group.name ?? id);
    return { ok: false, error: `AI tạo caption trùng nhau cho ${names.join(", ")}. Hãy chạy lại.`, skipped, warnings };
  }

  const grantedScopes = content.socialPage.connection?.connectionStatus === "CONNECTED"
    ? content.socialPage.connection.grantedScopes
    : [];
  const base = content.scheduledAt && content.scheduledAt > now ? content.scheduledAt : now;

  await prisma.$transaction(prepared.map((entry, index) => {
    const route = resolveGroupPublishRoute(snapshot(entry.group), grantedScopes);
    const scheduledAt = staggerGroupSchedule(base, index + 1, parsed.data.spacingMinutes);
    const status = route === "API" ? "SCHEDULED" as const : "MANUAL_REQUIRED" as const;
    const idempotencyKey = `group:${content.id}:${entry.group.id}`;
    const common = {
      captionOverride: entry.caption,
      scheduledAt,
      status,
      errorMessage: null,
      permanentFailure: false,
      attempts: 0,
      nextAttemptAt: null,
      lockedAt: null,
      lockToken: null,
      responseMetadata: { angle: entry.angle, route, aiProvider: provider } as Prisma.InputJsonValue,
    };
    return prisma.socialPublishTarget.upsert({
      where: { idempotencyKey },
      create: {
        ...common,
        socialContentId: content.id,
        socialPageId: content.socialPageId,
        socialGroupId: entry.group.id,
        targetType: "GROUP",
        idempotencyKey,
      },
      update: common,
    });
  }));

  await writeAuditLog({
    userId: user.id,
    tenantId: workspace.tenantId,
    action: "social.group.queue_build",
    resource: "SocialContent",
    resourceId: content.id,
    metadata: { groups: prepared.length, skipped: skipped.length, provider },
  });
  revalidateGroups(content.id);
  return { ok: true, created: prepared.length, skipped, warnings };
}

export async function markGroupTargetPostedAction(_previous: SocialGroupResult, formData: FormData): Promise<SocialGroupResult> {
  const parsed = markPostedSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const target = await prisma.socialPublishTarget.findUnique({
    where: { id: parsed.data.targetId },
    include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } },
  });
  if (!target || target.targetType !== "GROUP") return { ok: false, error: "Không tìm thấy mục phân phối Group" };
  if (target.status === "PUBLISHED") return { ok: false, error: "Mục này đã được đánh dấu đã đăng" };

  try {
    const user = await requireTenantAccess(target.socialPage.workspace.tenantId, "EDITOR");
    await prisma.socialPublishTarget.update({
      where: { id: target.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        externalPostUrl: parsed.data.postUrl || null,
        manualPostedById: user.id,
        errorMessage: null,
        permanentFailure: false,
        lockedAt: null,
        lockToken: null,
      },
    });
    await writeAuditLog({ userId: user.id, tenantId: target.socialPage.workspace.tenantId, action: "social.group.manual_posted", resource: "SocialPublishTarget", resourceId: target.id, metadata: { postUrl: parsed.data.postUrl || null } });
    revalidateGroups(target.socialContentId);
    return { ok: true, id: target.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Không thể đánh dấu đã đăng" };
  }
}

export async function skipGroupTargetAction(targetId: string, reason?: string): Promise<void> {
  const target = await prisma.socialPublishTarget.findUnique({
    where: { id: targetId },
    include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } },
  });
  if (!target || target.targetType !== "GROUP") throw new Error("Không tìm thấy mục phân phối Group");
  if (target.status === "PUBLISHED") throw new Error("Không thể bỏ qua mục đã đăng");
  const user = await requireTenantAccess(target.socialPage.workspace.tenantId, "EDITOR");
  await prisma.socialPublishTarget.update({
    where: { id: target.id },
    data: { status: "SKIPPED", errorMessage: reason?.slice(0, 500) || "Bỏ qua thủ công", lockedAt: null, lockToken: null },
  });
  await writeAuditLog({ userId: user.id, tenantId: target.socialPage.workspace.tenantId, action: "social.group.skip", resource: "SocialPublishTarget", resourceId: target.id });
  revalidateGroups(target.socialContentId);
}
