/**
 * Host/path rules shared by the edge proxy.
 *
 * Dependency-free on purpose: `proxy.ts` runs in the edge runtime, so nothing
 * here may reach for `node:` built-ins.
 */

export function normalizeHost(raw: string | null): string {
  if (!raw) return "";
  return raw.toLowerCase().replace(/:\d+$/, "");
}

/** Requests originating on the machine itself (the proxy's own internal fetch). */
export function isLoopbackHost(host: string): boolean {
  return host === "" || host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

/**
 * Endpoints the proxy calls over `INTERNAL_BASE_URL`. They carry no auth of
 * their own, so they must never be reachable from a public hostname — not even
 * the admin host.
 */
export function isInternalOnlyPath(pathname: string): boolean {
  return pathname === "/api/internal" || pathname.startsWith("/api/internal/");
}

/** Admin surfaces that must not be exposed on tenant hostnames. */
export function isAdminOnlyPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth/")
  );
}
