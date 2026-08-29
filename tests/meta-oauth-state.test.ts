import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { openMetaOauthState, sealMetaOauthState, type MetaOauthState } from "@/server/meta/oauth-state";

function state(overrides: Partial<MetaOauthState> = {}): MetaOauthState {
  return {
    nonce: "a".repeat(32),
    userId: "usr_1",
    socialPageId: "spg_1",
    expiresAt: Date.now() + 10 * 60_000,
    ...overrides,
  };
}

beforeEach(() => {
  process.env.SESSION_SECRET = "meta-oauth-state-secret-32-characters";
});

describe("Meta OAuth state cookie", () => {
  it("round-trips the state", () => {
    const original = state();
    assert.deepEqual(openMetaOauthState(sealMetaOauthState(original)), original);
  });

  it("rejects a state signed with another secret", () => {
    const sealed = sealMetaOauthState(state());
    process.env.SESSION_SECRET = "a-different-session-secret-32-chars!!";
    assert.equal(openMetaOauthState(sealed), null);
  });

  it("rejects a tampered payload", () => {
    const sealed = sealMetaOauthState(state());
    const [, signature] = sealed.split(".");
    const forged = Buffer.from(JSON.stringify(state({ userId: "usr_attacker" }))).toString("base64url");
    assert.equal(openMetaOauthState(`${forged}.${signature}`), null);
  });

  it("rejects an expired state", () => {
    assert.equal(openMetaOauthState(sealMetaOauthState(state({ expiresAt: Date.now() - 1 }))), null);
  });

  it("rejects a short nonce that could be guessed", () => {
    assert.equal(openMetaOauthState(sealMetaOauthState(state({ nonce: "short" }))), null);
  });

  it("rejects missing or malformed cookies", () => {
    for (const value of [undefined, "", ".", "nodot", "a.b"]) {
      assert.equal(openMetaOauthState(value), null);
    }
  });
});
