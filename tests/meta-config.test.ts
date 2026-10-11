import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { getMetaConfig, getMetaConfigurationStatus, META_PUBLISH_SCOPES, META_READ_SCOPES, META_REQUIRED_SCOPES } from "@/server/meta/client";

beforeEach(() => {
  process.env.META_APP_ID = "app_123";
  process.env.META_APP_SECRET = "secret_123";
  delete process.env.META_GRAPH_API_VERSION;
  delete process.env.META_GRAPH_VERSION;
  delete process.env.META_REDIRECT_URI;
});

describe("Meta configuration", () => {
  it("defaults to the confirmed /api/meta/callback alias and Graph v26", () => {
    const config = getMetaConfig();
    assert.equal(config.redirectUri, "https://gfvgo.com/api/meta/callback");
    assert.equal(config.graphVersion, "v26.0");
  });

  it("prefers META_GRAPH_API_VERSION while keeping META_GRAPH_VERSION compatible", () => {
    process.env.META_GRAPH_VERSION = "v25.0";
    process.env.META_GRAPH_API_VERSION = "v26.0";
    assert.equal(getMetaConfig().graphVersion, "v26.0");
    delete process.env.META_GRAPH_API_VERSION;
    assert.equal(getMetaConfig().graphVersion, "v25.0");
  });

  it("reports public configuration status without exposing secret values", () => {
    process.env.META_WEBHOOK_VERIFY_TOKEN = "verify-token";
    const status = getMetaConfigurationStatus();
    assert.equal(status.appId, true);
    assert.equal(status.appSecret, true);
    assert.equal(status.webhookVerifyToken, true);
    assert.equal(status.redirectUri, "https://gfvgo.com/api/meta/callback");
  });

  it("keeps read scopes separate and leaves publishing opt-in", () => {
    assert.ok(META_READ_SCOPES.includes("pages_show_list"));
    assert.ok(META_READ_SCOPES.includes("business_management"));
    assert.ok(META_PUBLISH_SCOPES.includes("pages_manage_posts"));
    assert.deepEqual([...META_REQUIRED_SCOPES], [...META_READ_SCOPES]);
  });
});
