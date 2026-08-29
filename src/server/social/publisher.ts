import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { writeAuditLog } from "@/server/audit/log";
import { decryptToken } from "@/server/crypto/token-vault";
import { getMetaPostMetrics, publishMetaPagePost } from "@/server/meta/client";
import { buildPostMessage, classifyMetaFailure, metaPostUrl, nextRetryAt } from "@/server/social/publish-rules";

type PublishResult = { targetId: string; status: "PUBLISHED" | "FAILED" | "SKIPPED"; externalPostId?: string; error?: string };

async function processClaimedTarget(targetId: string, lockToken: string): Promise<PublishResult> {
  const target = await prisma.socialPublishTarget.findFirst({
    where: { id: targetId, lockToken },
    include: { content: true, socialPage: { include: { connection: true, workspace: { select: { tenantId: true } } } } },
  });
  if (!target) return { targetId, status: "SKIPPED", error: "Target đã được worker khác xử lý" };

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
    await prisma.socialContent.update({ where: { id: target.content.id }, data: { status: permanent || exhausted ? "FAILED" : "SCHEDULED" } });
    await writeAuditLog({ tenantId: target.socialPage.workspace.tenantId, action: "social.publish.failed", resource: "SocialPublishTarget", resourceId: target.id, metadata: { code, permanent: permanent || exhausted } });
    return { targetId: target.id, status: "FAILED" as const, error: message };
  };

  if (target.targetType !== "PAGE") return fail("Phase C chỉ cho phép publisher tự động tới Facebook Page");
  if (target.status === "PUBLISHED" || target.externalPostId) return { targetId: target.id, status: "SKIPPED" };
  if (target.content.status !== "SCHEDULED" || !target.content.approvedAt) return fail("Nội dung chưa được duyệt và hẹn lịch hợp lệ");
  if (target.socialPage.status !== "CONNECTED" || !target.socialPage.externalPageId || !target.socialPage.connection) return fail("Facebook Page chưa được kết nối hợp lệ");
  if (target.socialPage.connection.connectionStatus !== "CONNECTED") return fail("Kết nối Meta đang không hợp lệ");
  if (target.socialPage.connection.tokenExpiresAt && target.socialPage.connection.tokenExpiresAt <= new Date()) return fail("Page access token đã hết hạn", true, 190);

  const message = buildPostMessage(target.content);
  if (!message) return fail("Bài viết không có caption để đăng");

  try {
    const token = decryptToken(target.socialPage.connection.encryptedToken);
    const published = await publishMetaPagePost(target.socialPage.externalPageId, token, target.captionOverride || message);
    const pagePostId = published.id;
    const externalPostUrl = metaPostUrl(pagePostId);
    await prisma.$transaction([
      prisma.socialPublishTarget.update({
        where: { id: target.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          externalPostId: pagePostId,
          externalPostUrl,
          errorMessage: null,
          permanentFailure: false,
          nextAttemptAt: null,
          lockedAt: null,
          lockToken: null,
          responseMetadata: { graphPostId: pagePostId },
        },
      }),
      prisma.socialContent.update({ where: { id: target.content.id }, data: { status: "PUBLISHED", sourcePostId: pagePostId } }),
    ]);
    await writeAuditLog({ tenantId: target.socialPage.workspace.tenantId, action: "social.publish.success", resource: "SocialPublishTarget", resourceId: target.id, metadata: { externalPostId: pagePostId } });
    return { targetId: target.id, status: "PUBLISHED", externalPostId: pagePostId };
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
      targetType: "PAGE",
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
