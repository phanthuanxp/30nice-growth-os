import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/cookie";

type ProxyFn = (req: NextRequest) => Promise<Response>;
let proxy: ProxyFn;

before(async () => {
  process.env.PRIMARY_HOST = "gfvgo.com";
  delete process.env.ADMIN_HOST;
  // Unreachable: tenant redirect lookups must fail fast and fall through.
  process.env.INTERNAL_BASE_URL = "http://127.0.0.1:9";
  ({ proxy } = (await import("@/proxy")) as { proxy: ProxyFn });
});

function request(host: string, path: string, cookie?: string): NextRequest {
  const headers = new Headers({ host });
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(`https://${host}${path}`, { headers });
}

describe("src/proxy.ts", () => {
  it("hides the internal API on every public host, including the product host", async () => {
    for (const host of ["gfvgo.com", "admin.gfvgo.com", "tenant.example.com"]) {
      const res = await proxy(request(host, "/api/internal/redirects?host=x"));
      assert.equal(res.status, 404, host);
    }
  });

  it("hides admin surfaces on tenant hosts", async () => {
    for (const path of ["/admin/dashboard", "/login", "/api/auth/login"]) {
      const res = await proxy(request("tenant.example.com", path, `${SESSION_COOKIE}=x`));
      assert.equal(res.status, 404, path);
    }
  });

  it("redirects anonymous admin visits on the product hosts to /login", async () => {
    for (const host of ["gfvgo.com", "www.gfvgo.com", "admin.gfvgo.com"]) {
      const res = await proxy(request(host, "/admin/dashboard"));
      assert.equal(res.status, 307, host);
      assert.match(res.headers.get("location") ?? "", /\/login\?from=%2Fadmin%2Fdashboard$/);
    }
  });

  it("recognises the session cookie the session helpers actually set", async () => {
    const res = await proxy(request("gfvgo.com", "/admin/dashboard", `${SESSION_COOKIE}=signed-token`));
    assert.equal(res.headers.get("x-middleware-next"), "1");
  });

  it("passes public tenant pages through", async () => {
    const res = await proxy(request("tenant.example.com", "/blog/hello"));
    assert.equal(res.headers.get("x-middleware-next"), "1");
  });
});
