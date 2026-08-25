"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth/session";
import { requireTenantAccess } from "@/server/permissions/guard";
import { writeAuditLog } from "@/server/audit/log";
import { decryptToken } from "@/server/crypto/token-vault";
import { debugMetaToken, getMetaConfig, getMetaPage, META_REQUIRED_SCOPES, subscribeMetaPageWebhooks } from "@/server/meta/client";
import { processSocialPublishQueue } from "@/server/social/publisher";

export type MetaActionResult = { ok: boolean; error?: string };

const selectSchema = z.object({ oauthSessionId: z.string().min(1), externalPageId: z.string().min(1) });
const pageMetadataSchema = z.array(z.object({ id: z.string(), name: z.string(), category: z.string().optional(), tasks: z.array(z.string()).optional(), link: z.string().optional() }));

function revalidateMeta() {
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/pages");
  revalidatePath("/admin/social/publishing");
}

function tokenExpiry(debug: { expires_at?: number; data_access_expires_at?: number }) {
  const candidates = [debug.expires_at, debug.data_access_expires_at].filter((value): value is number => Boolean(value && value > 0));
  return candidates.length ? new Date(Math.min(...candidates) * 1000) : null;
}

export async function selectMetaPageAction(_previous: MetaActionResult, formData: FormData): Promise<MetaActionResult> {
  const parsed = selectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Phiên kết nối hoặc Facebook Page không hợp lệ" };
  const user = await requireAuth();
  const oauthSession = await prisma.metaOAuthSession.findFirst({
    where: { id: parsed.data.oauthSessionId, userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } },
  });
  if (!oauthSession) return { ok: false, error: "Phiên kết nối đã hết hạn hoặc đã được sử dụng" };
  await requireTenantAccess(oauthSession.socialPage.workspace.tenantId, "TENANT_ADMIN");

  const pages = pageMetadataSchema.safeParse(oauthSession.availablePages);
  const tokenMap = z.record(z.string(), z.string()).safeParse(oauthSession.encryptedPageTokens);
  if (!pages.success || !tokenMap.success) return { ok: false, error: "Dữ liệu Page từ Meta không hợp lệ" };
  const page = pages.data.find((item) => item.id === parsed.data.externalPageId);
  const encryptedToken = tokenMap.data[parsed.data.externalPageId];
  if (!page || !encryptedToken) return { ok: false, error: "Facebook Page không thuộc phiên kết nối này" };
  if (page.tasks && !page.tasks.includes("CREATE_CONTENT")) return { ok: false, error: "Tài khoản Meta chưa có tác vụ CREATE_CONTENT trên Page này" };

  try {
    const token = decryptToken(encryptedToken);
    const debug = await debugMetaToken(token);
    const config = getMetaConfig();
    if (!debug.is_valid || (debug.app_id && debug.app_id !== config.appId)) return { ok: false, error: "Page access token không hợp lệ cho Meta App này" };
    const grantedScopes = [...new Set([...(debug.scopes || []), ...(page.tasks || []).map((task) => `task:${task}`)])];
    const external = await getMetaPage(page.id, token);
    await subscribeMetaPageWebhooks(page.id, token);

    await prisma.$transaction([
      prisma.socialConnection.upsert({
        where: { socialPageId: oauthSession.socialPageId },
        create: {
          socialPageId: oauthSession.socialPageId,
          encryptedToken,
          tokenExpiresAt: tokenExpiry(debug),
          grantedScopes,
          connectionStatus: "CONNECTED",
          lastValidatedAt: new Date(),
        },
        update: {
          encryptedToken,
          tokenExpiresAt: tokenExpiry(debug),
          grantedScopes,
          connectionStatus: "CONNECTED",
          lastValidatedAt: new Date(),
        },
      }),
      prisma.socialPage.update({ where: { id: oauthSession.socialPageId }, data: { externalPageId: external.id, pageUrl: external.link || page.link || null, status: "CONNECTED" } }),
      prisma.metaOAuthSession.update({ where: { id: oauthSession.id }, data: { consumedAt: new Date(), encryptedPageTokens: Prisma.JsonNull } }),
    ]);
    await writeAuditLog({ userId: user.id, tenantId: oauthSession.socialPage.workspace.tenantId, action: "social.meta.connect", resource: "SocialPage", resourceId: oauthSession.socialPageId, metadata: { externalPageId: external.id, grantedScopes } });
    revalidateMeta();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Không thể kết nối Facebook Page" };
  }
}

export async function validateMetaConnectionAction(socialPageId: string): Promise<void> {
  const page = await prisma.socialPage.findUnique({ where: { id: socialPageId }, include: { connection: true, workspace: { select: { tenantId: true } } } });
  if (!page?.connection || !page.externalPageId) throw new Error("Page chưa được kết nối Meta");
  const user = await requireTenantAccess(page.workspace.tenantId, "TENANT_ADMIN");
  try {
    const token = decryptToken(page.connection.encryptedToken);
    const [debug, external] = await Promise.all([debugMetaToken(token), getMetaPage(page.externalPageId, token)]);
    const missing = META_REQUIRED_SCOPES.filter((scope) => !(debug.scopes || []).includes(scope));
    const valid = debug.is_valid && missing.length === 0;
    if (valid) await subscribeMetaPageWebhooks(page.externalPageId, token);
    await prisma.$transaction([
      prisma.socialConnection.update({
        where: { id: page.connection.id },
        data: { connectionStatus: valid ? "CONNECTED" : "INVALID", grantedScopes: debug.scopes || [], tokenExpiresAt: tokenExpiry(debug), lastValidatedAt: new Date() },
      }),
      prisma.socialPage.update({ where: { id: page.id }, data: { name: page.name, pageUrl: external.link || page.pageUrl, status: valid ? "CONNECTED" : "SETUP" } }),
    ]);
    await writeAuditLog({ userId: user.id, tenantId: page.workspace.tenantId, action: "social.meta.validate", resource: "SocialPage", resourceId: page.id, metadata: { valid, missingScopes: missing } });
  } catch (error) {
    await prisma.$transaction([
      prisma.socialConnection.update({ where: { id: page.connection.id }, data: { connectionStatus: "INVALID", lastValidatedAt: new Date() } }),
      prisma.socialPage.update({ where: { id: page.id }, data: { status: "SETUP" } }),
    ]);
    throw error;
  } finally {
    revalidateMeta();
  }
}

export async function disconnectMetaPageAction(socialPageId: string): Promise<void> {
  const page = await prisma.socialPage.findUnique({ where: { id: socialPageId }, include: { workspace: { select: { tenantId: true } } } });
  if (!page) throw new Error("Không tìm thấy Page");
  const user = await requireTenantAccess(page.workspace.tenantId, "TENANT_ADMIN");
  await prisma.$transaction([
    prisma.socialConnection.deleteMany({ where: { socialPageId } }),
    prisma.socialPage.update({ where: { id: socialPageId }, data: { externalPageId: null, pageUrl: null, status: "SETUP" } }),
    prisma.socialPublishTarget.updateMany({ where: { socialPageId, status: { in: ["SCHEDULED", "FAILED"] } }, data: { status: "FAILED", permanentFailure: true, errorMessage: "Kết nối Meta đã bị ngắt" } }),
  ]);
  await writeAuditLog({ userId: user.id, tenantId: page.workspace.tenantId, action: "social.meta.disconnect", resource: "SocialPage", resourceId: socialPageId });
  revalidateMeta();
}

export async function retrySocialPublishTargetAction(targetId: string): Promise<void> {
  const target = await prisma.socialPublishTarget.findUnique({ where: { id: targetId }, include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } } });
  if (!target) throw new Error("Không tìm thấy publish target");
  const user = await requireTenantAccess(target.socialPage.workspace.tenantId, "TENANT_ADMIN");
  await prisma.$transaction([
    prisma.socialPublishTarget.update({ where: { id: target.id }, data: { status: "SCHEDULED", attempts: 0, nextAttemptAt: new Date(), permanentFailure: false, errorMessage: null, lockedAt: null, lockToken: null } }),
    prisma.socialContent.update({ where: { id: target.socialContentId }, data: { status: "SCHEDULED" } }),
  ]);
  await writeAuditLog({ userId: user.id, tenantId: target.socialPage.workspace.tenantId, action: "social.publish.retry", resource: "SocialPublishTarget", resourceId: target.id });
  revalidateMeta();
}

export async function publishSocialTargetNowAction(targetId: string): Promise<void> {
  const target = await prisma.socialPublishTarget.findUnique({ where: { id: targetId }, include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } } });
  if (!target) throw new Error("Không tìm thấy publish target");
  await requireTenantAccess(target.socialPage.workspace.tenantId, "TENANT_ADMIN");
  await prisma.$transaction([
    prisma.socialPublishTarget.update({ where: { id: target.id }, data: { scheduledAt: new Date(), nextAttemptAt: new Date(), status: "SCHEDULED", permanentFailure: false } }),
    prisma.socialContent.update({ where: { id: target.socialContentId }, data: { status: "SCHEDULED" } }),
  ]);
  await processSocialPublishQueue({ targetId: target.id, limit: 1 });
  revalidateMeta();
}
