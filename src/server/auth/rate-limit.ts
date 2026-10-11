/**
 * Fixed-window counter used to throttle credential stuffing against the login
 * endpoint. State is per-process, which matches the current single-process
 * deployment; moving to several instances would need a shared store.
 */

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  /** Seconds the caller should wait before retrying. Zero while allowed. */
  retryAfter: number;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  /** Cap on tracked keys, so an attacker rotating keys cannot grow the map without bound. */
  maxKeys?: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;

  constructor(options: RateLimiterOptions) {
    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.maxKeys = options.maxKeys ?? 10_000;
  }

  /** Records one attempt against `key` and reports whether it may proceed. */
  consume(key: string, now: number = Date.now()): RateLimitDecision {
    this.evictExpired(now);
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      if (this.buckets.size >= this.maxKeys) this.buckets.clear();
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.limit - 1, retryAfter: 0 };
    }

    if (bucket.count >= this.limit) {
      return { allowed: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
    }

    bucket.count += 1;
    return { allowed: true, remaining: this.limit - bucket.count, retryAfter: 0 };
  }

  /** Clears a key's window — called after a successful login. */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  private evictExpired(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}
