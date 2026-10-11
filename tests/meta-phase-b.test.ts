import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { MetaApiError, getMetaOAuthScopes, META_PUBLISH_SCOPES, META_READ_SCOPES, META_REQUIRED_SCOPES } from "@/server/meta/client";
import { normalizeMetaError } from "@/server/meta/errors";

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("Meta Phase B staged permissions", () => {
  it("uses core read scopes as the default OAuth scope set", () => {
    delete process.env.META_REQUEST_PUBLISH_SCOPE;
    assert.deepEqual([...META_REQUIRED_SCOPES], [...META_READ_SCOPES]);
    assert.deepEqual(getMetaOAuthScopes(), [...META_READ_SCOPES]);
    assert.equal(getMetaOAuthScopes().includes("pages_manage_posts"), false);
  });

  it("adds publish scope only when explicitly enabled", () => {
    process.env.META_REQUEST_PUBLISH_SCOPE = "true";
    assert.deepEqual(getMetaOAuthScopes(), [...META_READ_SCOPES, ...META_PUBLISH_SCOPES]);
    delete process.env.META_REQUEST_PUBLISH_SCOPE;
  });
});

describe("Meta Phase B REST routes", () => {
  it("adds the required pages/connect/disconnect/reconnect routes", () => {
    assert.match(source("src/app/api/meta/pages/route.ts"), /listMetaPages/);
    assert.match(source("src/app/api/meta/pages/connect/route.ts"), /connectMetaPageFromOAuthSession/);
    assert.match(source("src/app/api/meta/pages/[id]/disconnect/route.ts"), /disconnectMetaPageById/);
    assert.match(source("src/app/api/meta/pages/[id]/reconnect/route.ts"), /reconnectMetaPageById/);
  });

  it("reuses existing tenant guard and token vault and does not serialize raw tokens", () => {
    const service = source("src/server/meta/pages-service.ts");
    assert.match(service, /requireTenantAccess/);
    assert.match(service, /workspace\.tenant|tenantWhere/, "routes must reject cross-tenant access by resolving through tenant access checks");
    assert.match(service, /decryptToken/);
    assert.match(service, /SocialConnection/);
    assert.match(service, /MetaOAuthSession|metaOAuthSession/);
    assert.doesNotMatch(service, /access[_-]?token/i, "service responses should not expose raw access_token fields");
    assert.doesNotMatch(source("src/app/api/meta/pages/route.ts"), /encryptedToken|access_token/);
    assert.doesNotMatch(source("src/app/api/meta/pages/connect/route.ts"), /encryptedToken|access_token/);
  });

  it("does not hardcode the Pet Suphub smoke-test Page ID in production source", () => {
    const files = [
      "src/server/meta/pages-service.ts",
      "src/app/api/meta/pages/route.ts",
      "src/app/api/meta/pages/connect/route.ts",
      "src/app/api/meta/pages/[id]/disconnect/route.ts",
      "src/app/api/meta/pages/[id]/reconnect/route.ts",
    ].map(source).join("\n");
    assert.doesNotMatch(files, /541436539349001|Pet Suphub|Daily Cute Pets/i);
  });
});

describe("Meta Phase B normalized errors", () => {
  it("maps token expiration, missing permission, reconnect, page access and rate limit states", () => {
    assert.equal(normalizeMetaError(new MetaApiError("Session has expired", { code: 190, subcode: 463 })).status, "token_expired");
    assert.equal(normalizeMetaError(new MetaApiError("Requires permission", { code: 200 })).status, "permission_missing");
    assert.equal(normalizeMetaError(new MetaApiError("Reconnect OAuth token", { code: 190 })).status, "reconnect_required");
    assert.equal(normalizeMetaError(new MetaApiError("Object page access lost", { code: 803 })).status, "page_access_lost");
    assert.equal(normalizeMetaError(new MetaApiError("Application request limit reached", { code: 4 })).status, "rate_limited");
  });
});
