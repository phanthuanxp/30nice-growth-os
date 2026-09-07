import { promises as dns } from "node:dns";

/**
 * Guard against server-side request forgery in outbound crawl fetches.
 *
 * These URLs come from an EDITOR-or-above form field (a content source's base
 * URL, or a manually pasted article link) and are fetched by the server
 * unattended via cron. Without a check, that URL can point at a cloud metadata
 * endpoint (169.254.169.254), the app's own loopback-only internal API (a
 * request from the app itself carries a loopback Host header, satisfying that
 * check), or any other internal service.
 *
 * Residual risk: the address is validated at request time, not pinned for the
 * actual TCP connection, so a DNS answer that changes between the check and
 * `fetch()` connecting (DNS rebinding) is not covered. That would need pinning
 * the resolved IP into the connection itself, which Node's built-in `fetch`
 * does not expose without an extra HTTP client dependency. What this does stop
 * — a URL or redirect that points directly at an internal address — is the
 * exploit path an admin form field is actually exposed to.
 */

export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfBlockedError";
  }
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function ipv4ToInt(parts: number[]): number {
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function parseIpv4(address: string): number[] | null {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address);
  if (!match) return null;
  const parts = match.slice(1, 5).map(Number);
  if (parts.some((part) => part > 255)) return null;
  return parts;
}

/** IPv4 ranges that must never be reached from a server-initiated crawl. */
const IPV4_BLOCKED_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, includes cloud metadata
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16],
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
];

function isBlockedIpv4(address: string): boolean {
  const parts = parseIpv4(address);
  if (!parts) return false;
  const value = ipv4ToInt(parts);
  return IPV4_BLOCKED_RANGES.some(([base, prefix]) => {
    const baseParts = parseIpv4(base);
    if (!baseParts) return false;
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (value & mask) === (ipv4ToInt(baseParts) & mask);
  });
}

/**
 * Whether an IPv6 address falls in a blocked range: loopback, unspecified,
 * link-local, unique local (the IPv6 analogue of RFC1918), multicast, or an
 * IPv4-mapped/-compatible address whose embedded IPv4 is itself blocked.
 */
function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (/^fe[89ab]/.test(normalized)) return true; // fe80::/10, link-local
  if (/^f[cd]/.test(normalized)) return true; // fc00::/7, unique local
  if (normalized.startsWith("ff")) return true; // ff00::/8, multicast

  const mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(normalized);
  if (mapped) return isBlockedIpv4(mapped[1]);
  return false;
}

/** Pure classifier: is this literal address one a crawl must never reach? */
export function isBlockedAddress(address: string): boolean {
  if (address.includes(":")) return isBlockedIpv6(address);
  return isBlockedIpv4(address);
}

/** Syntactic checks only — no DNS lookup. Throws on a disallowed scheme or IP literal. */
export function assertAllowedUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError(`URL không hợp lệ: ${rawUrl}`);
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new SsrfBlockedError(`Giao thức không được phép: ${url.protocol}`);
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isBlockedAddress(hostname)) {
    throw new SsrfBlockedError(`Không được phép crawl địa chỉ nội bộ: ${hostname}`);
  }
  return url;
}

/** Resolves the hostname and rejects if any answer lands in a blocked range. */
export async function assertResolvesToPublicAddress(hostname: string): Promise<void> {
  // An IP literal has already been checked by assertAllowedUrl; skip the lookup.
  if (isBlockedAddress(hostname) || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":")) return;
  let records: { address: string }[];
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SsrfBlockedError(`Không phân giải được tên miền: ${hostname}`);
  }
  if (records.length === 0) throw new SsrfBlockedError(`Không phân giải được tên miền: ${hostname}`);
  const blocked = records.find((record) => isBlockedAddress(record.address));
  if (blocked) throw new SsrfBlockedError(`Tên miền phân giải tới địa chỉ nội bộ: ${hostname} → ${blocked.address}`);
}

export interface SafeFetchOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * `fetch`, but every hop — the initial URL and each redirect target — is
 * validated before it is requested. Redirects are followed manually so a
 * response that 302s to an internal address cannot slip past the check that
 * only ran on the URL the caller typed in.
 */
export async function safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let current = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const url = assertAllowedUrl(current);
    await assertResolvesToPublicAddress(url.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      // Crawl and import fetches must never be served from Next.js's fetch cache:
      // a stale cached response would mean re-processing content that no longer
      // exists, or missing an update that does.
      response = await fetch(url, { headers: options.headers, redirect: "manual", signal: controller.signal, cache: "no-store" });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new SsrfBlockedError(`Quá thời gian khi tải: ${url.hostname}`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return response;
      current = new URL(location, url).toString();
      continue;
    }
    return response;
  }
  throw new SsrfBlockedError(`Quá số lần chuyển hướng cho phép (${maxRedirects})`);
}

/** Reads a response body up to `maxBytes`, throwing rather than buffering an unbounded reply. */
export async function readCappedText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return response.text();

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new SsrfBlockedError(`Phản hồi vượt quá giới hạn ${maxBytes} byte`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf-8");
}
