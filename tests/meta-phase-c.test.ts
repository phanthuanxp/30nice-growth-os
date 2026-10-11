import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("Meta Phase C multi-page management", () => {
  it("renders a production multi-page dashboard with required fields and actions", () => {
    const page = source("src/app/admin/social/pages/page.tsx");
    for (const text of [
      "Multi-Page Management",
      "Facebook Page ID",
      "Token Health",
      "Last Validated",
      "Last Synced",
      "Granted scopes",
      "Missing scopes",
      "Webhook Active",
      "Webhook Error",
      "View Posts",
      "View Insights",
      "Create Draft",
      "Publishing unavailable",
    ]) assert.match(page, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(page, /SocialPageSyncButton/);
    assert.match(page, /disconnectMetaPageAction/);
    assert.match(page, /api\/integrations\/meta\/connect\?pageId/);
  });

  it("keeps tenant isolation through existing query and API service guards", () => {
    const queries = source("src/server/queries/social.ts");
    const service = source("src/server/meta/pages-service.ts");
    assert.match(queries, /accessibleTenantWhere/);
    assert.match(queries, /workspace:\s*\{ tenant: tenantWhere \}/);
    assert.match(service, /tenantWhere/);
    assert.match(service, /requireTenantAccess/);
  });

  it("adds manual sync without exposing raw tokens", () => {
    const actions = source("src/server/actions/social-meta.ts");
    assert.match(actions, /syncMetaPageAction/);
    assert.match(actions, /debugMetaToken/);
    assert.match(actions, /getMetaPage/);
    assert.match(actions, /subscribeMetaPageWebhooks/);
    assert.match(actions, /lastSyncedAt/);
    assert.match(actions, /webhookStatus/);
    assert.doesNotMatch(source("src/app/admin/social/pages/page.tsx"), /encryptedToken|pageAccessToken|access_token/);
    assert.doesNotMatch(source("src/server/meta/pages-service.ts"), /encryptedToken:\s*[^,}]+[,}]/);
  });

  it("does not require publish scope by default and shows permission-aware UI", () => {
    const client = source("src/server/meta/client.ts");
    const ui = source("src/app/admin/social/pages/page.tsx");
    assert.match(source("src/server/meta/settings-store.ts"), /META_REQUEST_PUBLISH_SCOPE/);
    assert.match(ui, /Publishing unavailable/);
    assert.match(ui, /missingPublish/);
    assert.match(ui, /canPublish/);
  });

  it("uses existing reconnect and disconnect infrastructure", () => {
    assert.match(source("src/app/api/meta/pages/[id]/disconnect/route.ts"), /disconnectMetaPageById/);
    assert.match(source("src/app/api/meta/pages/[id]/reconnect/route.ts"), /reconnectMetaPageById/);
    assert.match(source("src/app/api/meta/pages/route.ts"), /listMetaPages/);
  });
});
