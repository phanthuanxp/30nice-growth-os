import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MetaApiError } from "@/server/meta/client";
import {
  buildPostMessage,
  classifyMetaFailure,
  MAX_RETRY_DELAY_MINUTES,
  metaPostUrl,
  nextRetryAt,
} from "@/server/social/publish-rules";

const NOW = new Date("2026-08-29T10:00:00.000Z");

describe("post message assembly", () => {
  it("joins caption, CTA and hashtags with blank lines", () => {
    const message = buildPostMessage({
      caption: "Caption đầy đủ",
      callToAction: "Gọi 0961657891",
      hashtags: ["#taxi", "#bacninh"],
    });
    assert.equal(message, "Caption đầy đủ\n\nGọi 0961657891\n\n#taxi #bacninh");
  });

  it("skips empty parts instead of leaving blank gaps", () => {
    assert.equal(buildPostMessage({ caption: "Chỉ caption", callToAction: null, hashtags: [] }), "Chỉ caption");
    assert.equal(buildPostMessage({ caption: "  ", callToAction: "CTA", hashtags: [] }), "CTA");
  });

  it("returns an empty string when there is nothing to post", () => {
    assert.equal(buildPostMessage({ caption: null, callToAction: null, hashtags: [] }), "");
    assert.equal(buildPostMessage({ caption: "   ", callToAction: "  ", hashtags: [] }), "");
  });
});

describe("Meta failure classification", () => {
  it("retries transient and throttling errors", () => {
    for (const code of [1, 2, 4, 17, 32, 613]) {
      assert.equal(classifyMetaFailure(new MetaApiError("transient", { code })).permanent, false, `code ${code}`);
    }
  });

  it("never retries permission or token errors", () => {
    for (const code of [10, 100, 190, 200]) {
      assert.equal(classifyMetaFailure(new MetaApiError("permission", { code })).permanent, true, `code ${code}`);
    }
  });

  it("treats unknown codes and non-Meta errors as permanent", () => {
    assert.equal(classifyMetaFailure(new MetaApiError("no code")).permanent, true);
    assert.equal(classifyMetaFailure(new MetaApiError("odd", { code: 99999 })).permanent, true);
    assert.equal(classifyMetaFailure(new Error("boom")).permanent, true);
    assert.equal(classifyMetaFailure("boom").code, null);
  });

  it("carries the trace id and truncates very long messages", () => {
    const classified = classifyMetaFailure(new MetaApiError("x".repeat(5000), { code: 1, traceId: "trace-1" }));
    assert.equal(classified.traceId, "trace-1");
    assert.equal(classified.message.length, 1000);
  });
});

describe("retry backoff", () => {
  it("doubles the delay per attempt", () => {
    assert.equal(nextRetryAt(1, NOW).getTime() - NOW.getTime(), 2 * 60_000);
    assert.equal(nextRetryAt(2, NOW).getTime() - NOW.getTime(), 4 * 60_000);
    assert.equal(nextRetryAt(3, NOW).getTime() - NOW.getTime(), 8 * 60_000);
  });

  it("caps the delay at an hour and never goes below the first step", () => {
    assert.equal(nextRetryAt(99, NOW).getTime() - NOW.getTime(), MAX_RETRY_DELAY_MINUTES * 60_000);
    assert.equal(nextRetryAt(0, NOW).getTime() - NOW.getTime(), 2 * 60_000);
  });
});

describe("permalink", () => {
  it("splits the page and post id on the first underscore only", () => {
    assert.equal(metaPostUrl("123_456"), "https://www.facebook.com/123/posts/456");
    assert.equal(metaPostUrl("123_456_789"), "https://www.facebook.com/123/posts/456_789");
  });
});
