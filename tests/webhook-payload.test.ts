import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAuthoredByPage, isStorableComment, parseFeedEvent } from "@/server/social/webhook-payload";

const RECEIVED = new Date("2026-09-05T10:00:00.000Z");
const PAGE_ID = "100000000000001";

function commentPayload(overrides: Record<string, unknown> = {}) {
  return {
    value: {
      from: { id: "222", name: "Nguyễn An" },
      item: "comment",
      post_id: `${PAGE_ID}_555`,
      comment_id: "555_777",
      verb: "add",
      created_time: 1788000000,
      message: "Cho mình hỏi giá đi Hà Giang?",
      ...overrides,
    },
  };
}

describe("feed webhook parsing", () => {
  it("reads a comment event", () => {
    const event = parseFeedEvent(commentPayload(), RECEIVED);
    assert.equal(event?.item, "comment");
    assert.equal(event?.verb, "add");
    assert.equal(event?.postId, `${PAGE_ID}_555`);
    assert.equal(event?.commentId, "555_777");
    assert.equal(event?.authorName, "Nguyễn An");
    assert.equal(event?.message, "Cho mình hỏi giá đi Hà Giang?");
    assert.equal(event?.postedAt.toISOString(), new Date(1788000000 * 1000).toISOString());
  });

  it("accepts the change value with or without the stored wrapper", () => {
    const wrapped = parseFeedEvent(commentPayload(), RECEIVED);
    const bare = parseFeedEvent(commentPayload().value, RECEIVED);
    assert.deepEqual(bare, wrapped);
  });

  it("falls back to the received time when Meta omits created_time", () => {
    const event = parseFeedEvent(commentPayload({ created_time: undefined }), RECEIVED);
    assert.equal(event?.postedAt.toISOString(), RECEIVED.toISOString());
  });

  it("keeps post, reaction and share events but marks them unstorable", () => {
    for (const item of ["post", "status", "photo", "video", "share", "reaction"]) {
      const event = parseFeedEvent(commentPayload({ item, comment_id: undefined }), RECEIVED);
      assert.equal(event?.item, item, item);
      assert.equal(isStorableComment(event!), false, item);
    }
  });

  it("treats a comment without an id as unstorable", () => {
    const event = parseFeedEvent(commentPayload({ comment_id: undefined }), RECEIVED);
    assert.equal(isStorableComment(event!), false);
  });

  it("handles every verb Meta sends", () => {
    for (const verb of ["add", "edited", "remove", "hide", "unhide"]) {
      assert.equal(parseFeedEvent(commentPayload({ verb }), RECEIVED)?.verb, verb, verb);
    }
  });

  it("returns null rather than guessing at unknown shapes", () => {
    assert.equal(parseFeedEvent(commentPayload({ item: "mention" }), RECEIVED), null);
    assert.equal(parseFeedEvent(commentPayload({ verb: "exploded" }), RECEIVED), null);
    assert.equal(parseFeedEvent(commentPayload({ post_id: undefined }), RECEIVED), null);
    assert.equal(parseFeedEvent(commentPayload({ post_id: "  " }), RECEIVED), null);
    assert.equal(parseFeedEvent({ value: null }, RECEIVED), null);
    assert.equal(parseFeedEvent(null, RECEIVED), null);
    assert.equal(parseFeedEvent("not an object", RECEIVED), null);
  });

  it("tolerates a missing author", () => {
    const event = parseFeedEvent(commentPayload({ from: undefined }), RECEIVED);
    assert.equal(event?.authorId, null);
    assert.equal(event?.authorName, null);
  });
});

describe("page-authored comments", () => {
  it("recognises the Page replying to itself", () => {
    const event = parseFeedEvent(commentPayload({ from: { id: PAGE_ID, name: "30Nice" } }), RECEIVED)!;
    assert.equal(isAuthoredByPage(event, PAGE_ID), true);
  });

  it("treats a visitor comment as incoming", () => {
    const event = parseFeedEvent(commentPayload(), RECEIVED)!;
    assert.equal(isAuthoredByPage(event, PAGE_ID), false);
  });

  it("does not match when either side is unknown", () => {
    const anonymous = parseFeedEvent(commentPayload({ from: undefined }), RECEIVED)!;
    assert.equal(isAuthoredByPage(anonymous, PAGE_ID), false);
    const known = parseFeedEvent(commentPayload(), RECEIVED)!;
    assert.equal(isAuthoredByPage(known, null), false);
  });
});
