import { Prisma, type SocialConnection, type SocialPage, type SocialPlatform, type SocialPageStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth/session";
import { requireTenantAccess } from "@/server/permissions/guard";
import { decryptToken } from "@/server/crypto/token-vault";
import { writeAuditLog } from "@/server/audit/log";
import { debugMetaToken, getMetaConfig, getMetaPage, META_PUBLISH_SCOPES, META_READ_SCOPES, subscribeMetaPageWebhooks } from "@/server/meta/client";
import { metaErrorHttpStatus, normalizeMetaError } from "@/server/meta/errors";

export type MetaRouteResult<T> = { status: number; body: T | { error: string; metaStatus?: string; code?: number; subcode?: number; traceId?: string } };

function tokenExpiry(debug: { expires_at?: number; data_access_expires_at?: number }) {
  const candidates = [debug.expires_at, debug.data_access_expires_at].filter((value): value is number => Boolean(value && value > 0));
  return candidates.length ? new Date(Math.min(...candidates) * 1000) : null;
}

function canPublishFromScopes(scopes: string[]) {
  return META_PUBLISH_SCOPES.every((scope) => scopes.includes(scope)) || scopes.includes("task:CREATE_CONTENT");
}

function launchMeta(value: Prisma.JsonValue | null): Record<string, Prisma.JsonValue> {
  const base = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : {};
  const meta = base.meta && typeof base.meta === "object" && !Array.isArray(base.meta) ? base.meta as Record<string, Prisma.JsonValue> : {};
  return meta;
}

type MetaPageListRow = Pick<SocialPage, "id" | "name" | "platform" | "status" | "category" | "externalPageId" | "pageUrl" | "launchKit" | "updatedAt"> & {
  workspace: { id: string; name: string; tenant: { id: string; name: string } };
  connection: Pick<SocialConnection, "connectionStatus" | "lastValidatedAt" | "tokenExpiresAt" | "grantedScopes"> | null;
  _count: { contents: number; plans: number; publishTargets: number };
};

function serializePage(page: MetaPageListRow) {
  const scopes = page.connection?.grantedScopes ?? [];
  const meta = launchMeta(page.launchKit);
  const tokenExpired = Boolean(page.connection?.tokenExpiresAt && page.connection.tokenExpiresAt <= new Date());
  const missingReadScopes = META_READ_SCOPES.filter((scope) => !scopes.includes(scope));
  const missingPublishScopes = META_PUBLISH_SCOPES.filter((scope) => !scopes.includes(scope));
  const canPublish = canPublishFromScopes(scopes);
  const tokenHealth = tokenExpired ? "TOKEN_EXPIRED" : missingReadScopes.length ? "PERMISSION_MISSING" : page.connection?.connectionStatus === "CONNECTED" ? "HEALTHY" : "NEEDS_RECONNECT";
  return {
    id: page.id,
    name: page.name,
    platform: page.platform,
    status: page.status,
    category: page.category,
    externalPageId: page.externalPageId,
    pageUrl: page.pageUrl,
    workspace: { id: page.workspace.id, name: page.workspace.name, tenant: page.workspace.tenant },
    meta: {
      avatarUrl: typeof meta.avatarUrl === "string" ? meta.avatarUrl : null,
      lastSyncedAt: typeof meta.lastSyncedAt === "string" ? meta.lastSyncedAt : null,
      webhookStatus: typeof meta.webhookStatus === "string" ? meta.webhookStatus : "UNKNOWN",
      tokenHealth,
    },
    connection: page.connection ? {
      status: page.connection.connectionStatus,
      lastValidatedAt: page.connection.lastValidatedAt,
      tokenExpiresAt: page.connection.tokenExpiresAt,
      grantedScopes: scopes,
      missingReadScopes,
      missingPublishScopes,
      canPublish,
    } : null,
    counts: page._count,
  };
}

export async function listMetaPages(): Promise<MetaRouteResult<{ pages: ReturnType<typeof serializePage>[] }>> {
  const user = await requireAuth();
  const tenantWhere: Prisma.TenantWhereInput = user.role === "SUPER_ADMIN"
    ? {}
    : user.role === "AGENCY_ADMIN"
      ? { organization: { members: { some: { userId: user.id } } } }
      : { members: { some: { userId: user.id } } };
  const pages = await prisma.socialPage.findMany({
    where: { platform: "FACEBOOK", status: { not: "ARCHIVED" }, workspace: { tenant: tenantWhere } },
    orderBy: { updatedAt: "desc" },
    include: {
      workspace: { select: { id: true, name: true, tenant: { select: { id: true, name: true } } } },
      connection: { select: { connectionStatus: true, lastValidatedAt: true, tokenExpiresAt: true, grantedScopes: true } },
      _count: { select: { contents: true, plans: true, publishTargets: true } },
    },
  });
  return { status: 200, body: { pages: pages.map(serializePage) } };
}

export async function connectMetaPageFromOAuthSession(input: { oauthSessionId: string; externalPageId: string }): Promise<MetaRouteResult<{ ok: true; pageId: string; externalPageId: string; canPublish: boolean; webhookSubscribed: boolean }>> {
  const user = await requireAuth();
  const oauthSession = await prisma.metaOAuthSession.findFirst({
    where: { id: input.oauthSessionId, userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } },
  });
  if (!oauthSession) return { status: 404, body: { error: "Phiên kết nối đã hết hạn hoặc đã được sử dụng", metaStatus: "reconnect_required" } };
  await requireTenantAccess(oauthSession.socialPage.workspace.tenantId, "TENANT_ADMIN");

  const available = Array.isArray(oauthSession.availablePages) ? oauthSession.availablePages : [];
  const tokenMap = oauthSession.encryptedPageTokens && typeof oauthSession.encryptedPageTokens === "object" && !Array.isArray(oauthSession.encryptedPageTokens)
    ? oauthSession.encryptedPageTokens as Record<string, unknown>
    : {};
  const page = available.find((item): item is { id: string; name: string; tasks?: string[]; link?: string } => Boolean(item && typeof item === "object" && "id" in item && (item as { id?: unknown }).id === input.externalPageId));
  const encryptedTokenValue = tokenMap[input.externalPageId];
  const encryptedToken = typeof encryptedTokenValue === "string" ? encryptedTokenValue : null;
  if (!page || !encryptedToken) return { status: 400, body: { error: "Facebook Page không thuộc phiên kết nối này", metaStatus: "page_access_lost" } };
  const tasks = Array.isArray(page.tasks) ? page.tasks.filter((task): task is string => typeof task === "string") : [];
  const hasReadTask = tasks.length === 0 || tasks.some((task) => ["ANALYZE", "ADVERTISE", "MODERATE", "CREATE_CONTENT"].includes(task));
  if (!hasReadTask) return { status: 403, body: { error: "Tài khoản Meta chưa có quyền đọc/quản trị Page này", metaStatus: "permission_missing" } };

  try {
    const token = decryptToken(encryptedToken);
    const debug = await debugMetaToken(token);
    const config = getMetaConfig();
    if (!debug.is_valid || (debug.app_id && debug.app_id !== config.appId)) return { status: 409, body: { error: "Page access token không hợp lệ cho Meta App này", metaStatus: "reconnect_required" } };
    const grantedScopes = [...new Set([...(debug.scopes || []), ...tasks.map((task) => `task:${task}`)])];
    const missingReadScopes = META_READ_SCOPES.filter((scope) => !grantedScopes.includes(scope));
    if (missingReadScopes.length) return { status: 403, body: { error: `Thiếu quyền Meta đọc/quản trị: ${missingReadScopes.join(", ")}`, metaStatus: "permission_missing" } };
    const external = await getMetaPage(page.id, token);
    const webhookSubscribed = await subscribeMetaPageWebhooks(page.id, token).catch(() => false);
    const canPublish = canPublishFromScopes(grantedScopes);

    const pageName = external.name || page.name || oauthSession.socialPage.name;
    await prisma.$transaction([
      prisma.socialConnection.upsert({
        where: { socialPageId: oauthSession.socialPageId },
        create: { socialPageId: oauthSession.socialPageId, encryptedToken, tokenExpiresAt: tokenExpiry(debug), grantedScopes, connectionStatus: "CONNECTED", lastValidatedAt: new Date() },
        update: { encryptedToken, tokenExpiresAt: tokenExpiry(debug), grantedScopes, connectionStatus: "CONNECTED", lastValidatedAt: new Date() },
      }),
      prisma.socialPage.update({
        where: { id: oauthSession.socialPageId },
        data: {
          name: pageName,
          category: external.category || ("category" in page && typeof page.category === "string" ? page.category : null),
          externalPageId: external.id,
          pageUrl: external.link || page.link || null,
          status: "CONNECTED",
          launchKit: { source: "existing_facebook_page", connectedAt: new Date().toISOString() },
        },
      }),
      prisma.metaOAuthSession.update({ where: { id: oauthSession.id }, data: { consumedAt: new Date(), encryptedPageTokens: Prisma.JsonNull } }),
    ]);
    await writeAuditLog({ userId: user.id, tenantId: oauthSession.socialPage.workspace.tenantId, action: "social.meta.rest_connect", resource: "SocialPage", resourceId: oauthSession.socialPageId, metadata: { externalPageId: external.id, grantedScopes, canPublish, webhookSubscribed } });
    return { status: 200, body: { ok: true, pageId: oauthSession.socialPageId, externalPageId: external.id, canPublish, webhookSubscribed } };
  } catch (error) {
    const normalized = normalizeMetaError(error);
    return { status: metaErrorHttpStatus(normalized.status), body: { error: normalized.message, metaStatus: normalized.status, code: normalized.code, subcode: normalized.subcode, traceId: normalized.traceId } };
  }
}

export async function disconnectMetaPageById(socialPageId: string): Promise<MetaRouteResult<{ ok: true }>> {
  const page = await prisma.socialPage.findUnique({ where: { id: socialPageId }, include: { workspace: { select: { tenantId: true } } } });
  if (!page) return { status: 404, body: { error: "Không tìm thấy Page" } };
  const user = await requireTenantAccess(page.workspace.tenantId, "TENANT_ADMIN");
  await prisma.$transaction([
    prisma.socialConnection.deleteMany({ where: { socialPageId } }),
    prisma.socialPage.update({ where: { id: socialPageId }, data: { externalPageId: null, pageUrl: null, status: "SETUP" } }),
    prisma.socialPublishTarget.updateMany({ where: { socialPageId, status: { in: ["SCHEDULED", "FAILED"] } }, data: { status: "FAILED", permanentFailure: true, errorMessage: "Kết nối Meta đã bị ngắt" } }),
  ]);
  await writeAuditLog({ userId: user.id, tenantId: page.workspace.tenantId, action: "social.meta.rest_disconnect", resource: "SocialPage", resourceId: socialPageId });
  return { status: 200, body: { ok: true } };
}

export async function reconnectMetaPageById(socialPageId: string): Promise<MetaRouteResult<{ reconnectUrl: string }>> {
  const page = await prisma.socialPage.findUnique({ where: { id: socialPageId }, include: { workspace: { select: { tenantId: true } } } });
  if (!page) return { status: 404, body: { error: "Không tìm thấy Page" } };
  await requireTenantAccess(page.workspace.tenantId, "TENANT_ADMIN");
  return { status: 200, body: { reconnectUrl: `/api/meta/login?pageId=${encodeURIComponent(socialPageId)}` } };
}
