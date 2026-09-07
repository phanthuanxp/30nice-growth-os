import { timingSafeEqual } from "node:crypto";

/** Constant-time string comparison that does not leak length through timing alone. */
export function secretsMatch(supplied: string | null | undefined, expected: string | null | undefined): boolean {
  if (!supplied || !expected) return false;
  const a = Buffer.from(supplied, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Authorize a cron request from its headers.
 *
 * Both header forms are accepted because the scheduled workflows use both:
 * `x-cron-secret` for the publish/social jobs and `Authorization: Bearer` for
 * the crawl job. The secret is never read from the query string — that would
 * put it in access logs and referrers. A missing CRON_SECRET always denies,
 * including in development, so a misconfigured environment fails closed.
 */
export function isAuthorizedCronRequest(headers: Headers, expected = process.env.CRON_SECRET): boolean {
  if (!expected) return false;
  if (secretsMatch(headers.get("x-cron-secret"), expected)) return true;
  const authorization = headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;
  return secretsMatch(authorization.slice("Bearer ".length), expected);
}
