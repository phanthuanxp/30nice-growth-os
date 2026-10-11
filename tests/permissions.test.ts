import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { can, canAdmin, canEdit, isSuperAdmin, ROLE_LABELS } from "@/server/permissions";
import type { Role } from "@/server/auth/token";

const ORDERED: Role[] = ["VIEWER", "EDITOR", "TENANT_ADMIN", "AGENCY_ADMIN", "SUPER_ADMIN"];

describe("role ranking", () => {
  it("lets a role satisfy every requirement at or below it", () => {
    ORDERED.forEach((role, index) => {
      ORDERED.slice(0, index + 1).forEach((required) => {
        assert.equal(can(role, required), true, `${role} should satisfy ${required}`);
      });
      ORDERED.slice(index + 1).forEach((required) => {
        assert.equal(can(role, required), false, `${role} must not satisfy ${required}`);
      });
    });
  });

  it("keeps VIEWER out of edit and admin surfaces", () => {
    assert.equal(canEdit("VIEWER"), false);
    assert.equal(canAdmin("VIEWER"), false);
    assert.equal(canAdmin("EDITOR"), false);
    assert.equal(canEdit("EDITOR"), true);
    assert.equal(canAdmin("TENANT_ADMIN"), true);
  });

  it("recognises only SUPER_ADMIN as the platform owner", () => {
    assert.equal(isSuperAdmin("SUPER_ADMIN"), true);
    assert.equal(isSuperAdmin("AGENCY_ADMIN"), false);
  });

  it("labels every role", () => {
    ORDERED.forEach((role) => assert.equal(typeof ROLE_LABELS[role], "string"));
  });
});
