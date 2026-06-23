import { headers } from "next/headers";
import { getTenantByDomain, getTenantBySubdomain } from "@/server/queries/tenants";
import { tenants as demoTenants } from "@/server/queries/demo-data";

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

const PRIMARY_HOST = (process.env.PRIMARY_HOST ?? "30nice.vn").toLowerCase();
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

export async function resolveTenant(): Promise<ResolvedTenant> {
  const rawHost = (await headers()).get("host") ?? "";
  const host = normalizeHost(rawHost);

  const cached = getCached(host);
  if (cached) return cached;

  try {
    let tenant = await getTenantByDomain(host);
    if (!tenant) {
      const sub = parseSubdomain(host);
      if (sub) tenant = await getTenantBySubdomain(sub);
    }
    if (tenant) {
      const resolved: ResolvedTenant = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        primaryDomain: tenant.primaryDomain,
      };
      setCached(host, resolved);
      return resolved;
    }
  } catch {
    // DB not available — fall through to demo
  }

  const demo = demoTenants.find((t) => t.primaryDomain === host) ?? demoTenants[0];
  return demo;
}
