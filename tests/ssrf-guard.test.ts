import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertAllowedUrl, isBlockedAddress, SsrfBlockedError } from "@/server/http/ssrf-guard";

describe("IPv4 address classification", () => {
  it("blocks loopback", () => {
    assert.equal(isBlockedAddress("127.0.0.1"), true);
    assert.equal(isBlockedAddress("127.255.255.255"), true);
  });

  it("blocks RFC1918 private ranges", () => {
    assert.equal(isBlockedAddress("10.0.0.1"), true);
    assert.equal(isBlockedAddress("172.16.0.1"), true);
    assert.equal(isBlockedAddress("172.31.255.255"), true);
    assert.equal(isBlockedAddress("192.168.1.1"), true);
  });

  it("blocks link-local, including the cloud metadata endpoint", () => {
    assert.equal(isBlockedAddress("169.254.169.254"), true);
    assert.equal(isBlockedAddress("169.254.0.1"), true);
  });

  it("blocks the unspecified address, CGNAT and multicast/reserved ranges", () => {
    assert.equal(isBlockedAddress("0.0.0.0"), true);
    assert.equal(isBlockedAddress("100.64.0.1"), true);
    assert.equal(isBlockedAddress("224.0.0.1"), true);
    assert.equal(isBlockedAddress("255.255.255.255"), true);
  });

  it("does not block ordinary public addresses", () => {
    assert.equal(isBlockedAddress("8.8.8.8"), false);
    assert.equal(isBlockedAddress("1.1.1.1"), false);
    assert.equal(isBlockedAddress("93.184.216.34"), false);
  });

  it("does not false-positive on addresses that merely share a prefix digit", () => {
    // 172.32.0.1 looks close to the 172.16.0.0/12 block but falls outside it.
    assert.equal(isBlockedAddress("172.32.0.1"), false);
    // 11.0.0.1 is not 10.0.0.0/8.
    assert.equal(isBlockedAddress("11.0.0.1"), false);
  });

  it("respects exact range boundaries", () => {
    assert.equal(isBlockedAddress("172.15.255.255"), false);
    assert.equal(isBlockedAddress("172.16.0.0"), true);
    assert.equal(isBlockedAddress("172.31.255.255"), true);
    assert.equal(isBlockedAddress("172.32.0.0"), false);
  });
});

describe("IPv6 address classification", () => {
  it("blocks loopback and unspecified", () => {
    assert.equal(isBlockedAddress("::1"), true);
    assert.equal(isBlockedAddress("::"), true);
  });

  it("blocks link-local and unique-local ranges", () => {
    assert.equal(isBlockedAddress("fe80::1"), true);
    assert.equal(isBlockedAddress("fc00::1"), true);
    assert.equal(isBlockedAddress("fd12:3456:789a::1"), true);
  });

  it("blocks multicast", () => {
    assert.equal(isBlockedAddress("ff02::1"), true);
  });

  it("blocks an IPv4-mapped address whose embedded IPv4 is blocked", () => {
    assert.equal(isBlockedAddress("::ffff:127.0.0.1"), true);
    assert.equal(isBlockedAddress("::ffff:169.254.169.254"), true);
    assert.equal(isBlockedAddress("::ffff:10.0.0.5"), true);
  });

  it("does not block an IPv4-mapped address whose embedded IPv4 is public", () => {
    assert.equal(isBlockedAddress("::ffff:8.8.8.8"), false);
  });

  it("does not block ordinary public IPv6 addresses", () => {
    assert.equal(isBlockedAddress("2606:4700:4700::1111"), false);
    assert.equal(isBlockedAddress("2001:4860:4860::8888"), false);
  });

  it("is case-insensitive", () => {
    assert.equal(isBlockedAddress("FE80::1"), true);
    assert.equal(isBlockedAddress("FC00::1"), true);
  });
});

describe("URL-level validation", () => {
  it("accepts an ordinary https URL", () => {
    const url = assertAllowedUrl("https://example.com/sitemap.xml");
    assert.equal(url.hostname, "example.com");
  });

  it("rejects non-http(s) schemes", () => {
    assert.throws(() => assertAllowedUrl("file:///etc/passwd"), SsrfBlockedError);
    assert.throws(() => assertAllowedUrl("ftp://example.com/x"), SsrfBlockedError);
    assert.throws(() => assertAllowedUrl("gopher://example.com/x"), SsrfBlockedError);
  });

  it("rejects a URL that is not parseable", () => {
    assert.throws(() => assertAllowedUrl("not a url"), SsrfBlockedError);
  });

  it("rejects an IP-literal URL pointing at an internal address", () => {
    assert.throws(() => assertAllowedUrl("http://127.0.0.1/admin"), SsrfBlockedError);
    assert.throws(() => assertAllowedUrl("http://169.254.169.254/latest/meta-data/"), SsrfBlockedError);
    assert.throws(() => assertAllowedUrl("http://[::1]/x"), SsrfBlockedError);
  });

  it("accepts an IP-literal URL pointing at a public address", () => {
    const url = assertAllowedUrl("http://8.8.8.8/x");
    assert.equal(url.hostname, "8.8.8.8");
  });
});
