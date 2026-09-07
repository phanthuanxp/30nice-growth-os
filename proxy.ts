import { NextResponse, type NextRequest } from "next/server";
import { isAdminOnlyPath, isInternalOnlyPath, isLoopbackHost, normalizeHost } from "@/server/http/host-rules";

const PRIMARY_HOST = (process.env.PRIMARY_HOST ?? "30nice.vn").toLowerCase();
const ADMIN_HOST = (process.env.ADMIN_HOST ?? `admin.${PRIMARY_HOST}`).toLowerCase();
// Must point at the port this app actually listens on (3001 in deploy/ecosystem.config.js,
// which is also what nginx proxies to). A wrong value here fails silently: the fetch below
// throws, getRedirectRules() returns [], and tenant redirect rules simply never apply.
const INTERNAL_BASE = process.env.INTERNAL_BASE_URL ?? "http://127.0.0.1:3001";

type RedirectRule = { fromPath: string; toPath: string; statusCode: number };

// Per-host redirect cache: host → { rules, expiresAt }
const redirectCache = new Map<string, { rules: RedirectRule[]; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

async function getRedirectRules(host: string): Promise<RedirectRule[]> {
  const cached = redirectCache.get(host);
  if (cached && cached.expiresAt > Date.now()) return cached.rules;

  try {
    const res = await fetch(`${INTERNAL_BASE}/api/internal/redirects?host=${encodeURIComponent(host)}`, {
      signal: AbortSignal.timeout(500),
    });
    if (!res.ok) return [];
    const rules = (await res.json()) as RedirectRule[];
    redirectCache.set(host, { rules, expiresAt: Date.now() + CACHE_TTL_MS });
    // Evict if too large
    if (redirectCache.size > 256) {
      const oldest = redirectCache.keys().next().value;
      if (oldest) redirectCache.delete(oldest);
    }
    return rules;
  } catch {
    return [];
  }
}

/**
 * Edge proxy for multi-tenant routing:
 *  - Blocks /api/internal on every public hostname.
 *  - Blocks /admin and /login on non-admin hosts.
 *  - Applies per-tenant redirect rules (fetched from DB via internal API, cached 60s).
 *  - Passes everything else through; tenant resolution happens in resolveTenant().
 */
export async function proxy(req: NextRequest) {
  const host = normalizeHost(req.headers.get("host"));
  const { pathname } = req.nextUrl;

  // Localhost / dev: allow everything, including the proxy's own internal fetch
  if (isLoopbackHost(host)) {
    return NextResponse.next();
  }

  // The internal API has no auth of its own — it is only ever called by this
  // proxy over INTERNAL_BASE_URL, which arrives on a loopback host.
  if (isInternalOnlyPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const isAdminHost = host === ADMIN_HOST;

  // Security: tenant subdomains must not expose admin or login routes
  if (!isAdminHost) {
    if (isAdminOnlyPath(pathname)) {
      return new NextResponse(null, { status: 404 });
    }

    // Apply tenant redirect rules
    const rules = await getRedirectRules(host);
    const match = rules.find((r) => r.fromPath === pathname);
    if (match) {
      const dest = match.toPath.startsWith("http")
        ? match.toPath
        : `https://${host}${match.toPath}`;
      return NextResponse.redirect(dest, { status: match.statusCode });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, image optimization, favicon
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|map)$).*)",
  ],
};
