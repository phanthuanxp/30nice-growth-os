import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";

const DEFAULT_SETTINGS_PATH = "/var/www/gfvgo/.data/meta-settings.json";
const SETTINGS_PATH = process.env.META_SETTINGS_FILE || DEFAULT_SETTINGS_PATH;

const schema = z.object({
  appId: z.string().trim().optional().default(""),
  appSecret: z.string().trim().optional().default(""),
  tokenEncryptionKey: z.string().trim().optional().default(""),
  webhookVerifyToken: z.string().trim().optional().default(""),
  redirectUri: z.string().trim().optional().default(""),
  graphVersion: z.string().trim().optional().default(""),
  updatedAt: z.string().optional(),
});

export type MetaSettings = z.infer<typeof schema>;

export function readMetaSettings(): MetaSettings {
  try {
    if (process.env.NODE_ENV !== "production" && !process.env.META_SETTINGS_FILE) return schema.parse({});
    if (!existsSync(SETTINGS_PATH)) return schema.parse({});
    return schema.parse(JSON.parse(readFileSync(SETTINGS_PATH, "utf8")));
  } catch {
    return schema.parse({});
  }
}

export function writeMetaSettings(input: Partial<MetaSettings>) {
  const current = readMetaSettings();
  const next = schema.parse({ ...current, ...input, updatedAt: new Date().toISOString() });
  mkdirSync(dirname(SETTINGS_PATH), { recursive: true, mode: 0o700 });
  writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2), { mode: 0o600 });
  return next;
}

export function getMetaRuntimeSettings() {
  const saved = readMetaSettings();
  const production = process.env.NODE_ENV === "production";
  const first = (envValue: string | undefined, savedValue: string | undefined) => production ? savedValue || envValue || "" : envValue || savedValue || "";
  return {
    appId: first(process.env.META_APP_ID, saved.appId),
    appSecret: first(process.env.META_APP_SECRET, saved.appSecret),
    tokenEncryptionKey: first(process.env.TOKEN_ENCRYPTION_KEY, saved.tokenEncryptionKey),
    webhookVerifyToken: first(process.env.META_WEBHOOK_VERIFY_TOKEN, saved.webhookVerifyToken),
    redirectUri: first(process.env.META_REDIRECT_URI, saved.redirectUri) || "https://gfvgo.com/api/meta/callback",
    graphVersion: (production ? saved.graphVersion || process.env.META_GRAPH_API_VERSION || process.env.META_GRAPH_VERSION : process.env.META_GRAPH_API_VERSION || process.env.META_GRAPH_VERSION || saved.graphVersion) || "v26.0",
    // Publishing remains opt-in through META_REQUEST_PUBLISH_SCOPE only.
    requestPublishScope: ["1", "true", "yes", "on"].includes((process.env.META_REQUEST_PUBLISH_SCOPE || "").toLowerCase()),
    updatedAt: saved.updatedAt,
    source: saved.appId || saved.appSecret || saved.tokenEncryptionKey ? "admin_settings" : "env",
  };
}
