import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/cookie";
import { isAdminOnlyPath, isInternalOnlyPath, isLoopbackHost, normalizeHost } from "@/server/http/host-rules";

// This is the ONLY proxy file Next.js loads: with a src/ directory, a root-level
// proxy.ts is silently ignored. Keep all request-level rules here.

const PRIMARY_HOST = (process.env.PRIMARY_HOST ?? "gfvgo.com").toLowerCase();
const ADMIN_HOST = (process.env.ADMIN_HOST ?? `admin.${PRIMARY_HOST}`).toLowerCase();
const PRODUCT_HOSTS = new Set([PRIMARY_HOST, `www.${PRIMARY_HOST}`, ADMIN_HOST]);
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

function requireSession(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE));

  if ((pathname === "/admin" || pathname.startsWith("/admin/")) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

/**
 * Request-level rules for the multi-tenant app:
 *  - Blocks /api/internal on every public hostname.
 *  - Blocks /admin, /login and /api/auth on tenant hostnames.
 *  - Applies per-tenant redirect rules (fetched from DB via internal API, cached 60s).
 *  - Redirects anonymous /admin visits to /login (the admin layout re-checks the signature).
 * Tenant resolution itself happens in resolveTenant().
 */
export async function proxy(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host"));
  const { pathname } = request.nextUrl;

  // Localhost / dev, including the proxy's own internal fetch.
  if (isLoopbackHost(host)) {
    return requireSession(request);
  }

  // The internal API has no auth of its own — it is only ever called by this
  // proxy over INTERNAL_BASE_URL, which arrives on a loopback host.
  if (isInternalOnlyPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  if (PRODUCT_HOSTS.has(host)) {
    return requireSession(request);
  }

  // Tenant hostnames must not expose admin or login routes.
  if (isAdminOnlyPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const rules = await getRedirectRules(host);
  const match = rules.find((r) => r.fromPath === pathname);
  if (match) {
    const dest = match.toPath.startsWith("http") ? match.toPath : `https://${host}${match.toPath}`;
    return NextResponse.redirect(dest, { status: match.statusCode });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, image optimization, favicon
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|map)$).*)",
  ],
};
