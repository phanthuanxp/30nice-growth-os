import { createHmac, timingSafeEqual } from "node:crypto";

export type Role =
  | "SUPER_ADMIN"
  | "AGENCY_ADMIN"
  | "TENANT_ADMIN"
  | "EDITOR"
  | "VIEWER";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Session lifetime, in seconds. Kept in sync with the cookie's Max-Age. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const ROLES: readonly Role[] = ["SUPER_ADMIN", "AGENCY_ADMIN", "TENANT_ADMIN", "EDITOR", "VIEWER"];

interface SessionPayload extends SessionUser {
  /** Issued-at and expiry, both in seconds since the epoch. */
  iat: number;
  exp: number;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser, secret: string, now: Date = new Date()): string {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const claims: SessionPayload = { ...user, iat: issuedAt, exp: issuedAt + SESSION_MAX_AGE };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" && candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.role === "string" && ROLES.includes(candidate.role as Role) &&
    typeof candidate.iat === "number" && Number.isFinite(candidate.iat) &&
    typeof candidate.exp === "number" && Number.isFinite(candidate.exp)
  );
}

/**
 * Verify a session token and return its user, or `null` when the token is
 * malformed, wrongly signed, or expired.
 *
 * Tokens issued before expiry claims existed carry no `exp` and are rejected,
 * so everyone signed in at deploy time is asked to log in once more.
 */
export function parseSessionToken(token: string, secret: string, now: Date = new Date()): SessionUser | null {
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = token.slice(0, separator);

  let supplied: Buffer;
  try {
    supplied = Buffer.from(token.slice(separator + 1), "base64url");
  } catch {
    return null;
  }
  const expected = createHmac("sha256", secret).update(payload).digest();
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isSessionPayload(claims)) return null;
  if (claims.exp * 1000 <= now.getTime()) return null;

  return { id: claims.id, name: claims.name, email: claims.email, role: claims.role };
}
