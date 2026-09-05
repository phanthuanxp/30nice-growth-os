import { prisma } from "@/server/db";
import { isAuthoredByPage, isStorableComment, parseFeedEvent } from "@/server/social/webhook-payload";

/** How long a processed event is kept before it is pruned. */
export const WEBHOOK_RETENTION_DAYS = 30;
/** Give up on an event after this many failed passes so one bad row cannot block the queue. */
const MAX_EVENT_ATTEMPTS = 3;

export interface WebhookProcessResult {
  processed: number;
  commentsUpserted: number;
  commentsRemoved: number;
  ignored: number;
  failed: number;
  pruned: number;
}

/**
 * Consume stored feed webhooks into comment rows.
 *
 * Events arrive signed and are stored verbatim by the webhook route; this is the
 * only place they are interpreted. Anything unrecognised is marked processed
 * rather than retried forever — Meta sends far more than this system acts on.
 */
export async function processSocialWebhookEvents(limit = 200): Promise<WebhookProcessResult> {
  const result: WebhookProcessResult = { processed: 0, commentsUpserted: 0, commentsRemoved: 0, ignored: 0, failed: 0, pruned: 0 };

  const events = await prisma.socialWebhookEvent.findMany({
    where: { processedAt: null, attempts: { lt: MAX_EVENT_ATTEMPTS } },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), 500),
  });

  // Pages are looked up once per batch; a webhook batch normally covers few pages.
  const pageIds = [...new Set(events.map((event) => event.externalPageId).filter((id): id is string => Boolean(id)))];
  const pages = pageIds.length
    ? await prisma.socialPage.findMany({ where: { externalPageId: { in: pageIds } }, select: { id: true, externalPageId: true } })
    : [];
  const pageByExternalId = new Map(pages.map((page) => [page.externalPageId as string, page.id]));

  for (const event of events) {
    try {
      const feedEvent = event.field === "feed" ? parseFeedEvent(event.payload, event.createdAt) : null;

      if (!feedEvent || !isStorableComment(feedEvent)) {
        await prisma.socialWebhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date(), errorMessage: null } });
        result.ignored += 1;
        result.processed += 1;
        continue;
      }

      const commentId = feedEvent.commentId as string;

      if (feedEvent.verb === "remove") {
        const deleted = await prisma.socialComment.deleteMany({ where: { externalCommentId: commentId } });
        result.commentsRemoved += deleted.count;
      } else {
        const socialPageId = event.externalPageId ? pageByExternalId.get(event.externalPageId) ?? null : null;
        // Linking by the Graph post id is what ties a comment back to the
        // content that produced it; an unmatched comment is still kept.
        const target = await prisma.socialPublishTarget.findFirst({
          where: { externalPostId: feedEvent.postId },
          select: { id: true },
        });
        const data = {
          externalPostId: feedEvent.postId,
          publishTargetId: target?.id ?? null,
          socialPageId,
          parentCommentId: feedEvent.parentId,
          authorId: feedEvent.authorId,
          authorName: feedEvent.authorName,
          message: feedEvent.message,
          isFromPage: isAuthoredByPage(feedEvent, event.externalPageId),
          postedAt: feedEvent.postedAt,
        };
        await prisma.socialComment.upsert({
          where: { externalCommentId: commentId },
          create: { externalCommentId: commentId, ...data },
          update: data,
        });
        result.commentsUpserted += 1;
      }

      await prisma.socialWebhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date(), errorMessage: null } });
      result.processed += 1;
    } catch (error) {
      await prisma.socialWebhookEvent.update({
        where: { id: event.id },
        data: { attempts: { increment: 1 }, errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Lỗi xử lý webhook" },
      });
      result.failed += 1;
    }
  }

  // Without this the table only ever grows: every signed delivery since Phase C
  // is still sitting there.
  const cutoff = new Date(Date.now() - WEBHOOK_RETENTION_DAYS * 24 * 60 * 60_000);
  const pruned = await prisma.socialWebhookEvent.deleteMany({
    where: { processedAt: { not: null, lt: cutoff } },
  });
  result.pruned = pruned.count;

  return result;
}
