import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RateLimiter } from "@/server/auth/rate-limit";

describe("login rate limiting", () => {
  it("allows attempts up to the limit and blocks the next one", () => {
    const limiter = new RateLimiter({ limit: 3, windowMs: 60_000 });
    assert.deepEqual(limiter.consume("ip", 0), { allowed: true, remaining: 2, retryAfter: 0 });
    assert.equal(limiter.consume("ip", 0).allowed, true);
    assert.equal(limiter.consume("ip", 0).allowed, true);

    const blocked = limiter.consume("ip", 0);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.retryAfter, 60);
  });

  it("keys are independent", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 60_000 });
    assert.equal(limiter.consume("a", 0).allowed, true);
    assert.equal(limiter.consume("a", 0).allowed, false);
    assert.equal(limiter.consume("b", 0).allowed, true);
  });

  it("opens a fresh window once the old one elapses", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 60_000 });
    assert.equal(limiter.consume("ip", 0).allowed, true);
    assert.equal(limiter.consume("ip", 59_999).allowed, false);
    assert.equal(limiter.consume("ip", 60_000).allowed, true);
  });

  it("reports a shrinking retry-after as the window drains", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 60_000 });
    limiter.consume("ip", 0);
    assert.equal(limiter.consume("ip", 30_000).retryAfter, 30);
  });

  it("clears the window after a successful login", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 60_000 });
    limiter.consume("ip", 0);
    limiter.reset("ip");
    assert.equal(limiter.consume("ip", 0).allowed, true);
  });

  it("does not grow without bound when keys are rotated", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 4 });
    for (let index = 0; index < 50; index += 1) {
      assert.equal(limiter.consume(`ip-${index}`, 0).allowed, true);
    }
  });
});
