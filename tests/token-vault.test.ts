import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

const KEY = "token-vault-key-of-at-least-32-characters";

async function vault() {
  // The module reads TOKEN_ENCRYPTION_KEY lazily, so a fresh import is not needed.
  return import("@/server/crypto/token-vault");
}

afterEach(() => {
  process.env.TOKEN_ENCRYPTION_KEY = KEY;
});

describe("Meta token vault", () => {
  it("round-trips a page access token", async () => {
    process.env.TOKEN_ENCRYPTION_KEY = KEY;
    const { encryptToken, decryptToken } = await vault();
    const secret = "EAAB-page-access-token";
    assert.equal(decryptToken(encryptToken(secret)), secret);
  });

  it("produces a different ciphertext each time", async () => {
    process.env.TOKEN_ENCRYPTION_KEY = KEY;
    const { encryptToken } = await vault();
    assert.notEqual(encryptToken("same"), encryptToken("same"));
  });

  it("never leaves the plaintext in the sealed value", async () => {
    process.env.TOKEN_ENCRYPTION_KEY = KEY;
    const { encryptToken } = await vault();
    const sealed = encryptToken("EAAB-page-access-token");
    assert.equal(sealed.includes("EAAB-page-access-token"), false);
    assert.equal(sealed.startsWith("v1."), true);
  });

  it("refuses a tampered ciphertext", async () => {
    process.env.TOKEN_ENCRYPTION_KEY = KEY;
    const { encryptToken, decryptToken } = await vault();
    const [version, iv, tag, payload] = encryptToken("secret-token").split(".");
    const flipped = Buffer.from(payload, "base64url");
    flipped[0] ^= 0xff;
    assert.throws(() => decryptToken([version, iv, tag, flipped.toString("base64url")].join(".")));
  });

  it("refuses a value sealed with another key", async () => {
    process.env.TOKEN_ENCRYPTION_KEY = KEY;
    const { encryptToken, decryptToken } = await vault();
    const sealed = encryptToken("secret-token");
    process.env.TOKEN_ENCRYPTION_KEY = "a-completely-different-key-32-chars!!";
    assert.throws(() => decryptToken(sealed));
  });

  it("rejects malformed input and empty plaintext", async () => {
    process.env.TOKEN_ENCRYPTION_KEY = KEY;
    const { encryptToken, decryptToken } = await vault();
    assert.throws(() => encryptToken(""));
    assert.throws(() => decryptToken("not-a-sealed-token"));
    assert.throws(() => decryptToken("v2.a.b.c"));
  });

  it("reports whether the vault is configured", async () => {
    const { tokenVaultConfigured } = await vault();
    process.env.TOKEN_ENCRYPTION_KEY = KEY;
    assert.equal(tokenVaultConfigured(), true);
    process.env.TOKEN_ENCRYPTION_KEY = "too-short";
    assert.equal(tokenVaultConfigured(), false);
    delete process.env.TOKEN_ENCRYPTION_KEY;
    assert.equal(tokenVaultConfigured(), false);
  });
});
