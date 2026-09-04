import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { writeAuditLog } from "@/server/audit/log";
import { decryptToken } from "@/server/crypto/token-vault";
import { getMetaPostMetrics, publishMetaGroupPost, publishMetaPagePost } from "@/server/meta/client";
import { buildPostMessage, classifyMetaFailure, metaPostUrl, nextRetryAt } from "@/server/social/publish-rules";
import {
  evaluateGroupDistribution,
  resolveGroupPublishRoute,
  startOfDayInOffset,
  timezoneOffsetHours,
} from "@/server/social/group-rules";

type PublishResult = {
  targetId: string;
  status: "PUBLISHED" | "FAILED" | "SKIPPED" | "MANUAL_REQUIRED";
  externalPostId?: string;
  error?: string;
};

const targetInclude = {
  content: true,
  socialGroup: true,
  socialPage: {
    include: {
      connection: true,
      workspace: { select: { tenantId: true, timezone: true } },
    },
  },
} satisfies Prisma.SocialPublishTargetInclude;

/**
 * Recent posting activity for a group, read at publish time.
 *
 * The queue was already checked when it was built, but a group can hit its
 * daily limit or be posted into by hand in the meantime.
 */
async function groupActivity(socialGroupId: string, timezone: string, now: Date) {
  const dayStart = startOfDayInOffset(now, timezoneOffsetHours(timezone, now));
  const [postsToday, last] = await Promise.all([
    prisma.socialPublishTarget.count({
      where: { socialGroupId, status: "PUBLISHED", publishedAt: { gte: dayStart } },
    }),
    prisma.socialPublishTarget.findFirst({
      where: { socialGroupId, status: "PUBLISHED", publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    }),
  ]);
  return { postsToday, lastPostedAt: last?.publishedAt ?? null };
}

async function processClaimedTarget(targetId: string, lockToken: string): Promise<PublishResult> {
  const target = await prisma.socialPublishTarget.findFirst({ where: { id: targetId, lockToken }, include: targetInclude });
  if (!target) return { targetId, status: "SKIPPED", error: "Target đã được worker khác xử lý" };

  const isGroup = target.targetType === "GROUP";

  const fail = async (message: string, permanent = true, code: number | null = null, traceId?: string) => {
    const exhausted = target.attempts >= target.maxAttempts;
    await prisma.socialPublishTarget.update({
      where: { id: target.id },
      data: {
        status: "FAILED",
        errorMessage: message,
        permanentFailure: permanent || exhausted,
        nextAttemptAt: permanent || exhausted ? null : nextRetryAt(target.attempts),
        lockedAt: null,
        lockToken: null,
        responseMetadata: { errorCode: code, traceId: traceId || null, ambiguousNetworkResult: code === null },
      },
    });
    // Only the Page target owns the content's own status. A group failing must
    // not mark a post that already went live on the Page as failed.
    if (!isGroup) {
      await prisma.socialContent.update({ where: { id: target.content.id }, data: { status: permanent || exhausted ? "FAILED" : "SCHEDULED" } });
    }
    await writeAuditLog({
      tenantId: target.socialPage.workspace.tenantId,
      action: "social.publish.failed",
      resource: "SocialPublishTarget",
      resourceId: target.id,
      metadata: { code, permanent: permanent || exhausted, targetType: target.targetType },
    });
    return { targetId: target.id, status: "FAILED" as const, error: message };
  };

  /** Hand the target back to a person without burning a retry. */
  const requireManual = async (reason: string) => {
    await prisma.socialPublishTarget.update({
      where: { id: target.id },
      data: { status: "MANUAL_REQUIRED", errorMessage: reason, attempts: 0, nextAttemptAt: null, lockedAt: null, lockToken: null },
    });
    await writeAuditLog({
      tenantId: target.socialPage.workspace.tenantId,
      action: "social.group.manual_required",
      resource: "SocialPublishTarget",
      resourceId: target.id,
      metadata: { reason },
    });
    return { targetId: target.id, status: "MANUAL_REQUIRED" as const, error: reason };
  };

  if (target.status === "PUBLISHED" || target.externalPostId) return { targetId: target.id, status: "SKIPPED" };
  if (target.content.status === "PUBLISHED" && !isGroup) return { targetId: target.id, status: "SKIPPED" };

  const connection = target.socialPage.connection;
  if (target.socialPage.status !== "CONNECTED" || !target.socialPage.externalPageId || !connection) return fail("Facebook Page chưa được kết nối hợp lệ");
  if (connection.connectionStatus !== "CONNECTED") return fail("Kết nối Meta đang không hợp lệ");
  if (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date()) return fail("Page access token đã hết hạn", true, 190);

  let groupPostTargetId: string | null = null;
  if (isGroup) {
    const group = target.socialGroup;
    if (!group) return fail("Mục phân phối không còn gắn với Group nào");

    const now = new Date();
    const verdict = evaluateGroupDistribution({
      group: {
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
      },
      activity: await groupActivity(group.id, target.socialPage.workspace.timezone, now),
      now,
    });
    if (!verdict.allowed) return requireManual(verdict.reason ?? "Group không đủ điều kiện đăng lúc này");

    if (resolveGroupPublishRoute(group, connection.grantedScopes) !== "API") {
      return requireManual("Group chưa đủ điều kiện đăng tự động, cần đăng thủ công");
    }
    if (!group.externalGroupId) return requireManual("Group chưa có Facebook Group ID để gọi API");
    groupPostTargetId = group.externalGroupId;
  } else if (target.content.status !== "SCHEDULED" || !target.content.approvedAt) {
    return fail("Nội dung chưa được duyệt và hẹn lịch hợp lệ");
  }

  // A group target always posts its own variant; sharing the Page caption
  // verbatim across groups is exactly what the guardrails exist to prevent.
  const message = isGroup ? (target.captionOverride ?? "").trim() : (target.captionOverride || buildPostMessage(target.content));
  if (!message) return isGroup ? requireManual("Chưa có caption biến thể cho Group này") : fail("Bài viết không có caption để đăng");

  try {
    const token = decryptToken(connection.encryptedToken);
    const published = groupPostTargetId
      ? await publishMetaGroupPost(groupPostTargetId, token, message)
      : await publishMetaPagePost(target.socialPage.externalPageId, token, message);
    const postId = published.id;

    const writes: Prisma.PrismaPromise<unknown>[] = [
      prisma.socialPublishTarget.update({
        where: { id: target.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          externalPostId: postId,
          externalPostUrl: metaPostUrl(postId),
          errorMessage: null,
          permanentFailure: false,
          nextAttemptAt: null,
          lockedAt: null,
          lockToken: null,
          responseMetadata: { graphPostId: postId },
        },
      }),
    ];
    if (!isGroup) {
      writes.push(prisma.socialContent.update({ where: { id: target.content.id }, data: { status: "PUBLISHED", sourcePostId: postId } }));
    }
    await prisma.$transaction(writes);

    await writeAuditLog({
      tenantId: target.socialPage.workspace.tenantId,
      action: isGroup ? "social.group.publish.success" : "social.publish.success",
      resource: "SocialPublishTarget",
      resourceId: target.id,
      metadata: { externalPostId: postId },
    });
    return { targetId: target.id, status: "PUBLISHED", externalPostId: postId };
  } catch (error) {
    const classified = classifyMetaFailure(error);
    return fail(classified.message, classified.permanent, classified.code, classified.traceId);
  }
}

export async function processSocialPublishQueue(input: { limit?: number; targetId?: string } = {}) {
  const now = new Date();
  const staleLock = new Date(now.getTime() - 5 * 60_000);
  const candidates = await prisma.socialPublishTarget.findMany({
    where: {
      id: input.targetId,
      // MANUAL_REQUIRED is deliberately absent: those wait on a person, not a retry.
      status: { in: ["SCHEDULED", "FAILED"] },
      scheduledAt: { lte: now },
      permanentFailure: false,
      attempts: { lt: prisma.socialPublishTarget.fields.maxAttempts },
      AND: [
        { OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
        { OR: [{ lockedAt: null }, { lockedAt: { lt: staleLock } }] },
      ],
    },
    orderBy: { scheduledAt: "asc" },
    take: Math.min(Math.max(input.limit || 20, 1), 50),
    select: { id: true },
  });

  const results: PublishResult[] = [];
  for (const candidate of candidates) {
    const lockToken = randomUUID();
    const claimed = await prisma.socialPublishTarget.updateMany({
      where: { id: candidate.id, OR: [{ lockedAt: null }, { lockedAt: { lt: staleLock } }] },
      data: { lockedAt: now, lockToken, lastAttemptAt: now, attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;
    results.push(await processClaimedTarget(candidate.id, lockToken));
  }
  return results;
}

export async function syncSocialPostInsights(limit = 50) {
  const stale = new Date(Date.now() - 6 * 60 * 60_000);
  const targets = await prisma.socialPublishTarget.findMany({
    where: {
      // Group posts expose no insight metrics to a Page token, so only Page
      // posts are synced.
      targetType: "PAGE",
      status: "PUBLISHED",
      externalPostId: { not: null },
      socialPage: { connection: { is: { connectionStatus: "CONNECTED" } } },
      OR: [{ insight: null }, { insight: { capturedAt: { lt: stale } } }],
    },
    include: { insight: true, socialPage: { include: { connection: true, workspace: { select: { tenantId: true } } } } },
    orderBy: { publishedAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  let synced = 0;
  let failed = 0;
  for (const target of targets) {
    if (!target.externalPostId || !target.socialPage.connection) continue;
    try {
      const metrics = await getMetaPostMetrics(target.externalPostId, decryptToken(target.socialPage.connection.encryptedToken));
      const rawMetrics = JSON.parse(JSON.stringify(metrics.rawMetrics)) as Prisma.InputJsonValue;
      await prisma.socialPostInsight.upsert({
        where: { publishTargetId: target.id },
        create: { publishTargetId: target.id, ...metrics, rawMetrics },
        update: { ...metrics, rawMetrics, capturedAt: new Date() },
      });
      synced += 1;
    } catch {
      failed += 1;
    }
  }
  return { synced, failed };
}
