import { createHmac } from "node:crypto";
import { z } from "zod";
import { getMetaRuntimeSettings } from "@/server/meta/settings-store";

export const META_READ_SCOPES = ["pages_show_list", "pages_read_engagement", "pages_manage_metadata", "business_management"] as const;
export const META_PUBLISH_SCOPES = ["pages_manage_posts"] as const;
export const META_REQUIRED_SCOPES = META_READ_SCOPES;

export function shouldRequestMetaPublishScope() {
  return getMetaRuntimeSettings().requestPublishScope;
}

export function getMetaOAuthScopes() {
  return shouldRequestMetaPublishScope() ? [...META_READ_SCOPES, ...META_PUBLISH_SCOPES] : [...META_READ_SCOPES];
}

const metaErrorSchema = z.object({
  error: z.object({
    message: z.string().default("Meta API error"),
    type: z.string().optional(),
    code: z.number().optional(),
    error_subcode: z.number().optional(),
    fbtrace_id: z.string().optional(),
  }),
});

export class MetaApiError extends Error {
  readonly code?: number;
  readonly subcode?: number;
  readonly traceId?: string;

  constructor(message: string, input?: { code?: number; subcode?: number; traceId?: string }) {
    super(message);
    this.name = "MetaApiError";
    this.code = input?.code;
    this.subcode = input?.subcode;
    this.traceId = input?.traceId;
  }
}

export function getMetaConfig() {
  const config = getMetaRuntimeSettings();
  if (!config.appId || !config.appSecret) throw new Error("Meta App ID và App Secret chưa được cấu hình");
  if (!/^v\d+\.\d+$/.test(config.graphVersion)) throw new Error("Meta Graph API version không hợp lệ");
  return { appId: config.appId, appSecret: config.appSecret, redirectUri: config.redirectUri, graphVersion: config.graphVersion };
}

export function getMetaConfigurationStatus() {
  const config = getMetaRuntimeSettings();
  return {
    appId: Boolean(config.appId),
    appSecret: Boolean(config.appSecret),
    redirectUri: config.redirectUri,
    graphVersion: config.graphVersion,
    webhookVerifyToken: Boolean(config.webhookVerifyToken),
    requestPublishScope: config.requestPublishScope,
  };
}

function appSecretProof(token: string, appSecret: string) {
  return createHmac("sha256", appSecret).update(token).digest("hex");
}

async function parseMetaResponse(response: Response): Promise<unknown> {
  const payload: unknown = await response.json().catch(() => null);
  const metaError = metaErrorSchema.safeParse(payload);
  if (!response.ok || metaError.success) {
    const error = metaError.success ? metaError.data.error : null;
    throw new MetaApiError(error?.message || `Meta API trả về HTTP ${response.status}`, {
      code: error?.code,
      subcode: error?.error_subcode,
      traceId: error?.fbtrace_id,
    });
  }
  return payload;
}

async function oauthTokenRequest(params: Record<string, string>) {
  const config = getMetaConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`https://graph.facebook.com/${config.graphVersion}/oauth/access_token?${new URLSearchParams(params)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    return await parseMetaResponse(response);
  } catch (error) {
    if (error instanceof MetaApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new MetaApiError("Meta OAuth quá thời gian phản hồi");
    throw new MetaApiError("Không thể kết nối Meta OAuth");
  } finally {
    clearTimeout(timeout);
  }
}

async function graphRequest(path: string, input: {
  token: string;
  method?: "GET" | "POST";
  params?: Record<string, string>;
  includeProof?: boolean;
}) {
  const config = getMetaConfig();
  const method = input.method || "GET";
  const params = new URLSearchParams(input.params || {});
  params.set("access_token", input.token);
  if (input.includeProof !== false && !input.token.includes("|")) params.set("appsecret_proof", appSecretProof(input.token, config.appSecret));
  const base = `https://graph.facebook.com/${config.graphVersion}/${path.replace(/^\//, "")}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(method === "GET" ? `${base}?${params}` : base, {
      method,
      headers: method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
      body: method === "POST" ? params : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    return await parseMetaResponse(response);
  } catch (error) {
    if (error instanceof MetaApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new MetaApiError("Meta API quá thời gian phản hồi");
    throw new MetaApiError("Không thể kết nối Meta API");
  } finally {
    clearTimeout(timeout);
  }
}

const tokenSchema = z.object({ access_token: z.string().min(1), token_type: z.string().optional(), expires_in: z.number().optional() });
const pageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  access_token: z.string().min(1),
  tasks: z.array(z.string()).optional(),
  link: z.string().optional(),
  picture: z.object({ data: z.object({ url: z.string().optional() }).optional() }).optional(),
});

export type MetaManagedPage = Omit<z.infer<typeof pageSchema>, "access_token">;

export function buildMetaAuthorizeUrl(state: string) {
  const config = getMetaConfig();
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    state,
    response_type: "code",
    scope: getMetaOAuthScopes().join(","),
  });
  return `https://www.facebook.com/${config.graphVersion}/dialog/oauth?${params}`;
}

export async function exchangeMetaCode(code: string) {
  const config = getMetaConfig();
  const shortPayload = await oauthTokenRequest({ client_id: config.appId, client_secret: config.appSecret, redirect_uri: config.redirectUri, code });
  const shortToken = tokenSchema.parse(shortPayload);
  const longPayload = await oauthTokenRequest({ grant_type: "fb_exchange_token", client_id: config.appId, client_secret: config.appSecret, fb_exchange_token: shortToken.access_token });
  return tokenSchema.parse(longPayload);
}

export async function listMetaManagedPages(userToken: string) {
  const payload = await graphRequest("me/accounts", {
    token: userToken,
    params: { fields: "id,name,category,access_token,tasks,link,picture", limit: "100" },
  });
  const parsed = z.object({ data: z.array(pageSchema) }).parse(payload);
  return parsed.data;
}

const debugSchema = z.object({ data: z.object({
  app_id: z.string().optional(),
  is_valid: z.boolean(),
  expires_at: z.number().optional(),
  data_access_expires_at: z.number().optional(),
  scopes: z.array(z.string()).optional(),
  user_id: z.string().optional(),
}) });

export async function debugMetaToken(token: string) {
  const config = getMetaConfig();
  const payload = await graphRequest("debug_token", {
    token: `${config.appId}|${config.appSecret}`,
    includeProof: false,
    params: { input_token: token },
  });
  return debugSchema.parse(payload).data;
}

export async function getMetaMe(userToken: string) {
  const payload = await graphRequest("me", { token: userToken, params: { fields: "id,name" } });
  return z.object({ id: z.string(), name: z.string().optional() }).parse(payload);
}

export async function getMetaBusinesses(userToken: string) {
  const payload = await graphRequest("me/businesses", { token: userToken, params: { fields: "id,name,verification_status", limit: "100" } });
  return z.object({ data: z.array(z.object({ id: z.string(), name: z.string().optional(), verification_status: z.string().optional() })) }).parse(payload).data;
}

export async function getMetaPage(pageId: string, pageToken: string) {
  const payload = await graphRequest(encodeURIComponent(pageId), { token: pageToken, params: { fields: "id,name,link,category,picture" } });
  return z.object({ id: z.string(), name: z.string(), link: z.string().optional(), category: z.string().optional(), picture: z.object({ data: z.object({ url: z.string().optional() }).optional() }).optional() }).parse(payload);
}

export async function getMetaPagePosts(pageId: string, pageToken: string, limit = 10) {
  const payload = await graphRequest(`${encodeURIComponent(pageId)}/posts`, {
    token: pageToken,
    params: { fields: "id,message,created_time,permalink_url,status_type", limit: String(Math.min(Math.max(limit, 1), 25)) },
  });
  return z.object({ data: z.array(z.object({ id: z.string(), message: z.string().optional(), created_time: z.string().optional(), permalink_url: z.string().optional(), status_type: z.string().optional() })) }).parse(payload).data;
}

export async function publishMetaPagePost(pageId: string, pageToken: string, message: string) {
  const payload = await graphRequest(`${encodeURIComponent(pageId)}/feed`, { token: pageToken, method: "POST", params: { message, published: "true" } });
  return z.object({ id: z.string().min(1) }).parse(payload);
}

export async function subscribeMetaPageWebhooks(pageId: string, pageToken: string) {
  const payload = await graphRequest(`${encodeURIComponent(pageId)}/subscribed_apps`, {
    token: pageToken,
    method: "POST",
    params: { subscribed_fields: "feed" },
  });
  return z.object({ success: z.boolean() }).parse(payload).success;
}

function metricValue(payload: unknown, metric: string) {
  const parsed = z.object({ data: z.array(z.object({ name: z.string(), values: z.array(z.object({ value: z.number().or(z.record(z.string(), z.number())) })) })) }).safeParse(payload);
  if (!parsed.success) return 0;
  const value = parsed.data.data.find((item) => item.name === metric)?.values.at(-1)?.value;
  return typeof value === "number" ? value : 0;
}

export async function getMetaPostMetrics(postId: string, pageToken: string) {
  const countsPayload = await graphRequest(encodeURIComponent(postId), {
    token: pageToken,
    params: { fields: "reactions.limit(0).summary(true),comments.limit(0).summary(true),shares" },
  });
  const counts = z.object({
    reactions: z.object({ summary: z.object({ total_count: z.number().default(0) }) }).optional(),
    comments: z.object({ summary: z.object({ total_count: z.number().default(0) }) }).optional(),
    shares: z.object({ count: z.number().default(0) }).optional(),
  }).passthrough().parse(countsPayload);

  let insightPayload: unknown = { data: [] };
  try {
    insightPayload = await graphRequest(`${encodeURIComponent(postId)}/insights`, {
      token: pageToken,
      params: { metric: "post_media_view,post_total_media_view_unique" },
    });
  } catch {
    // Meta may remove metrics between Graph versions. Counts remain useful and syncing must continue.
  }
  const reactions = counts.reactions?.summary.total_count || 0;
  const comments = counts.comments?.summary.total_count || 0;
  const shares = counts.shares?.count || 0;
  return {
    views: metricValue(insightPayload, "post_media_view"),
    reach: metricValue(insightPayload, "post_total_media_view_unique"),
    engagements: reactions + comments + shares,
    reactions,
    comments,
    shares,
    rawMetrics: { counts: countsPayload, insights: insightPayload },
  };
}

/**
 * Read a group the connected Page can see. Used to verify, before switching a
 * group to API mode, that the token really reaches it — a group id typed into
 * the library is not proof of access.
 */
export async function getMetaGroup(groupId: string, pageToken: string) {
  const payload = await graphRequest(encodeURIComponent(groupId), { token: pageToken, params: { fields: "id,name,privacy" } });
  return z.object({ id: z.string(), name: z.string().optional(), privacy: z.string().optional() }).parse(payload);
}

/** Requires the publish_to_groups permission, which Meta grants only after app review. */
export async function publishMetaGroupPost(groupId: string, pageToken: string, message: string) {
  const payload = await graphRequest(`${encodeURIComponent(groupId)}/feed`, { token: pageToken, method: "POST", params: { message } });
  return z.object({ id: z.string().min(1) }).parse(payload);
}
