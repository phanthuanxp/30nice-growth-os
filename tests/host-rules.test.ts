import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAdminOnlyPath, isInternalOnlyPath, isLoopbackHost, normalizeHost } from "@/server/http/host-rules";

describe("host normalisation", () => {
  it("lowercases and strips the port", () => {
    assert.equal(normalizeHost("Admin.30Nice.VN:3002"), "admin.30nice.vn");
    assert.equal(normalizeHost(null), "");
  });

  it("recognises loopback hosts, including the proxy's own internal fetch", () => {
    assert.equal(isLoopbackHost(normalizeHost("localhost:3002")), true);
    assert.equal(isLoopbackHost(normalizeHost("127.0.0.1:3000")), true);
    assert.equal(isLoopbackHost(""), true);
    assert.equal(isLoopbackHost("admin.30nice.vn"), false);
    assert.equal(isLoopbackHost("localhost.evil.com"), false);
  });
});

describe("internal-only paths", () => {
  it("covers the internal API the proxy calls", () => {
    assert.equal(isInternalOnlyPath("/api/internal"), true);
    assert.equal(isInternalOnlyPath("/api/internal/redirects"), true);
  });

  it("does not swallow unrelated paths", () => {
    assert.equal(isInternalOnlyPath("/api/internals"), false);
    assert.equal(isInternalOnlyPath("/api/track"), false);
    assert.equal(isInternalOnlyPath("/blog/api/internal"), false);
  });
});

describe("admin-only paths", () => {
  it("blocks admin surfaces on tenant hostnames", () => {
    for (const pathname of ["/admin", "/admin/dashboard", "/admin/social/pages", "/login", "/api/auth/login"]) {
      assert.equal(isAdminOnlyPath(pathname), true, pathname);
    }
  });

  it("leaves public tenant routes alone", () => {
    for (const pathname of ["/", "/blog", "/blog/bai-viet", "/api/track", "/administrator", "/logins"]) {
      assert.equal(isAdminOnlyPath(pathname), false, pathname);
    }
  });
});
