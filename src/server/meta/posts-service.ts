import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { decryptToken } from "@/server/crypto/token-vault";
import { getMetaPagePosts } from "@/server/meta/client";
import { requireAuth } from "@/server/auth/session";
import { requireTenantAccess } from "@/server/permissions/guard";
import { writeAuditLog } from "@/server/audit/log";

export type MetaPostSyncResult = {
  ok: boolean;
  pageId?: string;
  synced?: number;
  error?: string;
};

function asJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function detectPostType(input: { status_type?: string; attachments?: unknown }) {
  if (input.status_type) return input.status_type.toUpperCase();
  const text = JSON.stringify(input.attachments ?? "").toLowerCase();
  if (text.includes("video") || text.includes("reel")) return "VIDEO";
  if (text.includes("photo") || text.includes("image")) return "IMAGE";
  return "TEXT";
}

export async function syncMetaPagePosts(pageId: string, limit = 25): Promise<MetaPostSyncResult> {
  const user = await requireAuth();
  const page = await prisma.socialPage.findUnique({
    where: { id: pageId },
    include: { workspace: { select: { id: true, tenantId: true } }, connection: true },
  });
  if (!page?.connection || !page.externalPageId) return { ok: false, error: "Facebook Page chưa được kết nối" };
  await requireTenantAccess(page.workspace.tenantId, "TENANT_ADMIN");

  try {
    const token = decryptToken(page.connection.encryptedToken);
    const posts = await getMetaPagePosts(page.externalPageId, token, limit);
    const syncedAt = new Date();
    let synced = 0;

    for (const post of posts) {
      await prisma.socialExternalPost.upsert({
        where: { socialPageId_externalPostId: { socialPageId: page.id, externalPostId: post.id } },
        create: {
          tenantId: page.workspace.tenantId,
          workspaceId: page.workspace.id,
          socialPageId: page.id,
          platform: page.platform,
          externalPostId: post.id,
          message: post.message ?? null,
          permalinkUrl: post.permalink_url ?? null,
          postType: detectPostType({ status_type: post.status_type, attachments: post.attachments }),
          mediaJson: asJson(post.attachments),
          rawMetadataJson: asJson({ status_type: post.status_type }),
          createdTime: parseDate(post.created_time),
          syncedAt,
        },
        update: {
          message: post.message ?? null,
          permalinkUrl: post.permalink_url ?? null,
          postType: detectPostType({ status_type: post.status_type, attachments: post.attachments }),
          mediaJson: asJson(post.attachments),
          rawMetadataJson: asJson({ status_type: post.status_type }),
          createdTime: parseDate(post.created_time),
          syncedAt,
        },
      });
      synced += 1;
    }

    await prisma.socialPage.update({
      where: { id: page.id },
      data: { launchKit: mergeMeta(page.launchKit, { postsLastSyncedAt: syncedAt.toISOString() }) },
    });
    await writeAuditLog({ userId: user.id, tenantId: page.workspace.tenantId, action: "social.meta.posts.sync", resource: "SocialPage", resourceId: page.id, metadata: { synced } });
    return { ok: true, pageId: page.id, synced };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Không thể đồng bộ bài viết Facebook" };
  }
}

function mergeMeta(value: Prisma.JsonValue | null, meta: Record<string, Prisma.JsonValue>) {
  const base = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : {};
  const currentMeta = base.meta && typeof base.meta === "object" && !Array.isArray(base.meta) ? base.meta as Record<string, Prisma.JsonValue> : {};
  return { ...base, meta: { ...currentMeta, ...meta } } as Prisma.InputJsonValue;
}

export async function duplicateExternalPostAsDraft(externalPostId: string) {
  const user = await requireAuth();
  const post = await prisma.socialExternalPost.findUnique({
    where: { id: externalPostId },
    include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } },
  });
  if (!post) return { ok: false, error: "Không tìm thấy bài viết đã sync" };
  await requireTenantAccess(post.tenantId, "EDITOR");
  const title = (post.message || "Facebook post draft").slice(0, 120) || "Facebook post draft";
  const draft = await prisma.socialContent.create({
    data: {
      socialPageId: post.socialPageId,
      topic: title,
      title,
      caption: post.message || "",
      format: post.postType === "VIDEO" ? "REEL" : post.postType === "IMAGE" ? "POST" : "POST",
      status: "DRAFT",
      sourcePostId: post.externalPostId,
      mediaBrief: {
        source: "META",
        originalExternalPostId: post.externalPostId,
        originalPageId: post.socialPage.externalPageId,
        originalPermalinkUrl: post.permalinkUrl,
        createdByUserId: user.id,
      },
      hashtags: [],
    },
  });
  await writeAuditLog({ userId: user.id, tenantId: post.tenantId, action: "social.external_post.duplicate", resource: "SocialExternalPost", resourceId: post.id, metadata: { draftId: draft.id, externalPostId: post.externalPostId } });
  return { ok: true, id: draft.id };
}
