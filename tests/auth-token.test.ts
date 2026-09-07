import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { createSessionToken, parseSessionToken, SESSION_MAX_AGE, type SessionUser } from "@/server/auth/token";

const SECRET = "test-session-secret-at-least-32-characters";
const USER: SessionUser = { id: "usr_1", name: "Quản trị", email: "admin@30nice.vn", role: "SUPER_ADMIN" };
const NOW = new Date("2026-08-29T10:00:00.000Z");

describe("session tokens", () => {
  it("round-trips a signed user", () => {
    const token = createSessionToken(USER, SECRET, NOW);
    assert.deepEqual(parseSessionToken(token, SECRET, NOW), USER);
  });

  it("rejects a token signed with another secret", () => {
    const token = createSessionToken(USER, SECRET, NOW);
    assert.equal(parseSessionToken(token, "a-different-secret-of-the-same-kind", NOW), null);
  });

  it("rejects a tampered payload", () => {
    const token = createSessionToken({ ...USER, role: "VIEWER" }, SECRET, NOW);
    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...USER, role: "SUPER_ADMIN", iat: 0, exp: 9e9 })).toString("base64url");
    assert.equal(parseSessionToken(`${forged}.${signature}`, SECRET, NOW), null);
  });

  it("expires the token once the session window has passed", () => {
    const token = createSessionToken(USER, SECRET, NOW);
    const justInside = new Date(NOW.getTime() + SESSION_MAX_AGE * 1000 - 1_000);
    const justOutside = new Date(NOW.getTime() + SESSION_MAX_AGE * 1000 + 1_000);
    assert.deepEqual(parseSessionToken(token, SECRET, justInside), USER);
    assert.equal(parseSessionToken(token, SECRET, justOutside), null);
  });

  it("rejects legacy tokens that carry no expiry", () => {
    const payload = Buffer.from(JSON.stringify(USER)).toString("base64url");
    const legacy = `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
    assert.equal(parseSessionToken(legacy, SECRET, NOW), null);
  });

  it("rejects an unknown role", () => {
    const claims = { ...USER, role: "ROOT", iat: 0, exp: 9_000_000_000 };
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const token = `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
    assert.equal(parseSessionToken(token, SECRET, NOW), null);
  });

  it("rejects malformed input instead of throwing", () => {
    for (const value of ["", ".", "no-separator", "a.b", "...."]) {
      assert.equal(parseSessionToken(value, SECRET, NOW), null);
    }
  });
});
