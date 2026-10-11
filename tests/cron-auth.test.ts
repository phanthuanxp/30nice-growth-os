import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAuthorizedCronRequest, secretsMatch } from "@/server/http/cron-auth";

const SECRET = "cron-secret-value";

function headers(init: Record<string, string>) {
  return new Headers(init);
}

describe("cron authentication", () => {
  it("accepts the x-cron-secret header used by the publish and social jobs", () => {
    assert.equal(isAuthorizedCronRequest(headers({ "x-cron-secret": SECRET }), SECRET), true);
  });

  it("accepts the bearer header used by the crawl job", () => {
    assert.equal(isAuthorizedCronRequest(headers({ authorization: `Bearer ${SECRET}` }), SECRET), true);
  });

  it("rejects a wrong or absent secret", () => {
    assert.equal(isAuthorizedCronRequest(headers({ "x-cron-secret": "nope" }), SECRET), false);
    assert.equal(isAuthorizedCronRequest(headers({ authorization: `Bearer ${SECRET}x` }), SECRET), false);
    assert.equal(isAuthorizedCronRequest(headers({}), SECRET), false);
  });

  it("rejects a bearer header without the scheme prefix", () => {
    assert.equal(isAuthorizedCronRequest(headers({ authorization: SECRET }), SECRET), false);
  });

  it("fails closed when CRON_SECRET is not configured", () => {
    assert.equal(isAuthorizedCronRequest(headers({ "x-cron-secret": "anything" }), undefined), false);
    assert.equal(isAuthorizedCronRequest(headers({ "x-cron-secret": "" }), ""), false);
  });

  it("compares secrets without treating empty values as a match", () => {
    assert.equal(secretsMatch("a", "a"), true);
    assert.equal(secretsMatch("a", "b"), false);
    assert.equal(secretsMatch("", ""), false);
    assert.equal(secretsMatch(null, SECRET), false);
    assert.equal(secretsMatch(SECRET, null), false);
    assert.equal(secretsMatch("short", "a-much-longer-secret"), false);
  });
});
