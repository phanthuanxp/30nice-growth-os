import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTenantByDomain, getTenantBySubdomain } from "@/server/queries/tenants";

export type ResolvedTenant = { id: string; name: string; slug: string; primaryDomain: string | null };

const CACHE_MAX = 256;
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: ResolvedTenant; expires: number }>();

function getCached(key: string): ResolvedTenant | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, hit);
  return hit.value;
}

function setCached(key: string, value: ResolvedTenant) {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

export function invalidateTenantCache(host?: string) {
  if (host) cache.delete(host.toLowerCase());
  else cache.clear();
}

const PRIMARY_HOST = (process.env.PRIMARY_HOST ?? "gfvgo.com").toLowerCase();
const ADMIN_HOST = (process.env.ADMIN_HOST ?? `admin.${PRIMARY_HOST}`).toLowerCase();

function normalizeHost(raw: string): string {
  return raw.toLowerCase().replace(/^www\./, "").replace(/:\d+$/, "");
}

/** Extract subdomain from host. Returns null if host IS the primary host, the admin host, or has no subdomain. */
function parseSubdomain(host: string): string | null {
  const normalized = normalizeHost(host);
  if (normalized === PRIMARY_HOST || normalized === ADMIN_HOST) return null;
  if (!normalized.endsWith(`.${PRIMARY_HOST}`)) return null;
  const sub = normalized.slice(0, normalized.length - PRIMARY_HOST.length - 1);
  if (!sub || sub === "admin") return null;
  return sub;
}

/**
 * Resolve the tenant for the current request host, or null when no tenant owns it.
 * Database errors propagate on purpose: rendering another tenant's (or fake) data
 * on a DB outage is worse than an error page.
 */
export async function resolveTenant(): Promise<ResolvedTenant | null> {
  const rawHost = (await headers()).get("host") ?? "";
  const host = normalizeHost(rawHost);

  const cached = getCached(host);
  if (cached) return cached;

  let tenant = await getTenantByDomain(host);
  if (!tenant) {
    const sub = parseSubdomain(host);
    if (sub) tenant = await getTenantBySubdomain(sub);
  }
  if (!tenant) return null;

  const resolved: ResolvedTenant = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    primaryDomain: tenant.primaryDomain,
  };
  setCached(host, resolved);
  return resolved;
}

/** Like resolveTenant(), but renders the 404 page when the host has no tenant. */
export async function requireTenant(): Promise<ResolvedTenant> {
  const tenant = await resolveTenant();
  if (!tenant) notFound();
  return tenant;
}
