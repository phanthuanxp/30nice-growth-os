import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  captionFingerprint,
  containsLink,
  containsPromotion,
  DEFAULT_GROUP_SPACING_MINUTES,
  evaluateGroupDistribution,
  findDuplicateCaptionGroups,
  META_GROUP_PUBLISH_SCOPE,
  resolveGroupPublishRoute,
  sanitizeGroupCaption,
  staggerGroupSchedule,
  startOfDayInOffset,
  timezoneOffsetHours,
  topicsOverlap,
  validateVariantCoverage,
  type GroupRuleSnapshot,
} from "@/server/social/group-rules";

const NOW = new Date("2026-09-03T10:00:00.000Z");

function group(overrides: Partial<GroupRuleSnapshot> = {}): GroupRuleSnapshot {
  return {
    id: "grp_1",
    name: "Review Du lịch Hà Giang",
    status: "APPROVED",
    mode: "MANUAL_ONLY",
    topics: ["du lịch", "hà giang"],
    dailyPostLimit: 1,
    cooldownHours: 24,
    allowLinks: true,
    allowPromotion: true,
    apiVerifiedAt: null,
    ...overrides,
  };
}

const IDLE = { postsToday: 0, lastPostedAt: null };

describe("group eligibility", () => {
  it("allows an approved, idle group", () => {
    const result = evaluateGroupDistribution({ group: group(), activity: IDLE, now: NOW });
    assert.equal(result.allowed, true);
    assert.deepEqual(result.warnings, []);
  });

  it("refuses a group that has not been approved", () => {
    for (const status of ["CANDIDATE", "PAUSED", "REJECTED"] as const) {
      const result = evaluateGroupDistribution({ group: group({ status }), activity: IDLE, now: NOW });
      assert.equal(result.allowed, false, status);
      assert.match(result.reason ?? "", new RegExp(status));
    }
  });

  it("refuses a disabled group even when approved", () => {
    const result = evaluateGroupDistribution({ group: group({ mode: "DISABLED" }), activity: IDLE, now: NOW });
    assert.equal(result.allowed, false);
    assert.match(result.reason ?? "", /tắt phân phối/);
  });

  it("enforces the daily post limit", () => {
    const twoPerDay = group({ dailyPostLimit: 2 });
    assert.equal(evaluateGroupDistribution({ group: twoPerDay, activity: { postsToday: 1, lastPostedAt: null }, now: NOW }).allowed, true);
    const full = evaluateGroupDistribution({ group: twoPerDay, activity: { postsToday: 2, lastPostedAt: null }, now: NOW });
    assert.equal(full.allowed, false);
    assert.match(full.reason ?? "", /giới hạn 2 bài\/ngày/);
  });

  it("treats a zero daily limit as closed rather than unlimited", () => {
    const result = evaluateGroupDistribution({ group: group({ dailyPostLimit: 0 }), activity: IDLE, now: NOW });
    assert.equal(result.allowed, false);
    assert.match(result.reason ?? "", /0 bài\/ngày/);
  });

  it("holds a group inside its cooldown window", () => {
    const activity = { postsToday: 0, lastPostedAt: new Date(NOW.getTime() - 23 * 60 * 60_000) };
    const blocked = evaluateGroupDistribution({ group: group(), activity, now: NOW });
    assert.equal(blocked.allowed, false);
    assert.match(blocked.reason ?? "", /giãn 24 giờ/);
  });

  it("releases a group once the cooldown has elapsed", () => {
    const activity = { postsToday: 0, lastPostedAt: new Date(NOW.getTime() - 24 * 60 * 60_000) };
    assert.equal(evaluateGroupDistribution({ group: group(), activity, now: NOW }).allowed, true);
  });

  it("ignores cooldown when the group sets none", () => {
    const activity = { postsToday: 0, lastPostedAt: new Date(NOW.getTime() - 60_000) };
    assert.equal(evaluateGroupDistribution({ group: group({ cooldownHours: 0 }), activity, now: NOW }).allowed, true);
  });

  it("warns, but does not block, on a topic mismatch", () => {
    const result = evaluateGroupDistribution({
      group: group(),
      activity: IDLE,
      contentTopics: ["chăm sóc da mùa đông"],
      now: NOW,
    });
    assert.equal(result.allowed, true);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /không khớp chủ đề/);
  });

  it("warns when API mode was switched on without verification", () => {
    const result = evaluateGroupDistribution({ group: group({ mode: "API_ALLOWED" }), activity: IDLE, now: NOW });
    assert.equal(result.allowed, true);
    assert.match(result.warnings.join(" "), /chưa xác minh quyền/);
  });

  it("reports the blocking reason ahead of any warning", () => {
    const result = evaluateGroupDistribution({
      group: group({ status: "PAUSED", mode: "API_ALLOWED" }),
      activity: { postsToday: 99, lastPostedAt: NOW },
      contentTopics: ["không liên quan"],
      now: NOW,
    });
    assert.equal(result.allowed, false);
    assert.match(result.reason ?? "", /PAUSED/);
  });
});

describe("topic matching", () => {
  it("accepts a group that declares no topics", () => {
    assert.equal(topicsOverlap([], ["bất kỳ"]), true);
  });

  it("matches on either direction of containment", () => {
    assert.equal(topicsOverlap(["du lịch"], ["du lịch hà giang giá rẻ"]), true);
    assert.equal(topicsOverlap(["du lịch hà giang"], ["du lịch"]), true);
  });

  it("rejects unrelated topics", () => {
    assert.equal(topicsOverlap(["du lịch"], ["kế toán doanh nghiệp"]), false);
  });

  it("ignores blank declared topics", () => {
    assert.equal(topicsOverlap(["  "], ["du lịch"]), false);
  });
});

describe("link and promotion detection", () => {
  it("spots links with and without a scheme", () => {
    assert.equal(containsLink("Xem tại https://30nice.vn/tour"), true);
    assert.equal(containsLink("Xem tại www.30nice.vn"), true);
    assert.equal(containsLink("Xem tại 30nice.vn/lien-he"), true);
    assert.equal(containsLink("Không có liên kết nào ở đây"), false);
  });

  it("spots a sales push", () => {
    assert.equal(containsPromotion("Giá chỉ 250k mỗi chuyến"), true);
    assert.equal(containsPromotion("Đang có khuyến mãi cuối tuần"), true);
    assert.equal(containsPromotion("Gọi ngay để được tư vấn"), true);
    assert.equal(containsPromotion("Hotline 0961657891"), true);
    assert.equal(containsPromotion("Chia sẻ kinh nghiệm đi Hà Giang tháng 10"), false);
  });

  it("is not confused by repeated calls (no sticky regex state)", () => {
    const text = "https://30nice.vn";
    assert.equal(containsLink(text), true);
    assert.equal(containsLink(text), true);
    assert.equal(containsPromotion("giá 250k"), true);
    assert.equal(containsPromotion("giá 250k"), true);
  });
});

describe("caption sanitising", () => {
  it("leaves a caption alone when the group permits everything", () => {
    const caption = "Kinh nghiệm đi Hà Giang: xem thêm https://30nice.vn/tour — giá chỉ 250k";
    assert.equal(sanitizeGroupCaption(caption, { allowLinks: true, allowPromotion: true }).caption, caption);
  });

  it("removes links when the group bans them", () => {
    const result = sanitizeGroupCaption("Chi tiết ở https://30nice.vn/tour nhé", { allowLinks: false, allowPromotion: true });
    assert.equal(containsLink(result.caption), false);
    assert.deepEqual(result.removed, ["liên kết"]);
  });

  it("removes a sales push when the group bans promotion", () => {
    const result = sanitizeGroupCaption("Tư vấn miễn phí, gọi ngay, giá chỉ 250k", { allowLinks: true, allowPromotion: false });
    assert.equal(containsPromotion(result.caption), false);
    assert.deepEqual(result.removed, ["nội dung chào bán"]);
  });

  it("reports both removals and tidies the leftover spacing", () => {
    const result = sanitizeGroupCaption("Xem https://30nice.vn/tour   và inbox ngay để nhận báo giá", { allowLinks: false, allowPromotion: false });
    assert.deepEqual(result.removed, ["liên kết", "nội dung chào bán"]);
    assert.equal(result.caption.includes("  "), false);
    assert.equal(result.caption.startsWith(" "), false);
  });

  it("reports nothing removed when there was nothing to remove", () => {
    const result = sanitizeGroupCaption("Chia sẻ lịch trình 3 ngày ở Hà Giang", { allowLinks: false, allowPromotion: false });
    assert.deepEqual(result.removed, []);
  });
});

describe("duplicate caption detection", () => {
  it("finds groups that would receive the same text", () => {
    const duplicates = findDuplicateCaptionGroups([
      { groupId: "a", caption: "Cùng đi Hà Giang tháng 10 nhé!" },
      { groupId: "b", caption: "cùng đi hà giang tháng 10 nhé" },
      { groupId: "c", caption: "Một góc nhìn khác về Hà Giang" },
    ]);
    assert.deepEqual(duplicates, [["a", "b"]]);
  });

  it("treats punctuation, casing and accents as noise", () => {
    assert.equal(captionFingerprint("Hà Giang, tháng 10!"), captionFingerprint("ha giang thang 10"));
  });

  it("returns nothing when every caption is distinct", () => {
    assert.deepEqual(findDuplicateCaptionGroups([
      { groupId: "a", caption: "Góc nhìn thứ nhất" },
      { groupId: "b", caption: "Góc nhìn thứ hai" },
    ]), []);
  });

  it("ignores captions that reduce to nothing", () => {
    assert.deepEqual(findDuplicateCaptionGroups([
      { groupId: "a", caption: "!!!" },
      { groupId: "b", caption: "???" },
    ]), []);
  });
});

describe("publish routing", () => {
  const verified = group({ mode: "API_ALLOWED", apiVerifiedAt: new Date("2026-09-01T00:00:00.000Z") });

  it("uses the API only for an approved, verified group with the scope granted", () => {
    assert.equal(resolveGroupPublishRoute(verified, [META_GROUP_PUBLISH_SCOPE, "pages_manage_posts"]), "API");
  });

  it("falls back to manual without the publish scope", () => {
    assert.equal(resolveGroupPublishRoute(verified, ["pages_manage_posts"]), "MANUAL");
  });

  it("falls back to manual when verification is missing", () => {
    assert.equal(resolveGroupPublishRoute(group({ mode: "API_ALLOWED" }), [META_GROUP_PUBLISH_SCOPE]), "MANUAL");
  });

  it("falls back to manual for MANUAL_ONLY and DISABLED groups", () => {
    assert.equal(resolveGroupPublishRoute(group({ apiVerifiedAt: NOW }), [META_GROUP_PUBLISH_SCOPE]), "MANUAL");
    assert.equal(resolveGroupPublishRoute(group({ mode: "DISABLED", apiVerifiedAt: NOW }), [META_GROUP_PUBLISH_SCOPE]), "MANUAL");
  });

  it("falls back to manual for a group that lost its approval", () => {
    assert.equal(resolveGroupPublishRoute({ ...verified, status: "PAUSED" }, [META_GROUP_PUBLISH_SCOPE]), "MANUAL");
  });
});

describe("scheduling", () => {
  it("spaces each group out from the base time", () => {
    assert.equal(staggerGroupSchedule(NOW, 0).getTime(), NOW.getTime());
    assert.equal(staggerGroupSchedule(NOW, 2).getTime(), NOW.getTime() + 2 * DEFAULT_GROUP_SPACING_MINUTES * 60_000);
  });

  it("honours a custom spacing and refuses a zero gap", () => {
    assert.equal(staggerGroupSchedule(NOW, 1, 15).getTime(), NOW.getTime() + 15 * 60_000);
    assert.equal(staggerGroupSchedule(NOW, 1, 0).getTime(), NOW.getTime() + 60_000);
  });

  it("computes the start of the local day for the daily-limit window", () => {
    // 03:00 UTC on 3 Sep is 10:00 in UTC+7, so the window opened at 17:00 UTC on 2 Sep.
    assert.equal(startOfDayInOffset(new Date("2026-09-03T03:00:00.000Z"), 7).toISOString(), "2026-09-02T17:00:00.000Z");
    // 20:00 UTC is already 3 am the next day in UTC+7, so the window has rolled over.
    assert.equal(startOfDayInOffset(new Date("2026-09-03T20:00:00.000Z"), 7).toISOString(), "2026-09-03T17:00:00.000Z");
  });
});

describe("time zone offsets", () => {
  it("resolves the workspace time zone used for the daily limit", () => {
    assert.equal(timezoneOffsetHours("Asia/Bangkok", NOW), 7);
    assert.equal(timezoneOffsetHours("UTC", NOW), 0);
  });

  it("follows daylight saving rather than assuming a fixed offset", () => {
    assert.equal(timezoneOffsetHours("Europe/London", new Date("2026-01-15T12:00:00.000Z")), 0);
    assert.equal(timezoneOffsetHours("Europe/London", new Date("2026-07-15T12:00:00.000Z")), 1);
  });

  it("handles half-hour offsets and falls back to UTC on a bad zone", () => {
    assert.equal(timezoneOffsetHours("Asia/Kolkata", NOW), 5.5);
    assert.equal(timezoneOffsetHours("Not/AZone", NOW), 0);
  });
});

describe("AI variant coverage", () => {
  it("accepts exactly one variant per requested group", () => {
    assert.equal(validateVariantCoverage(["a", "b"], ["b", "a"]), null);
  });

  it("rejects a duplicated group", () => {
    assert.match(validateVariantCoverage(["a", "b"], ["a", "a", "b"]) ?? "", /trùng Group/);
  });

  it("rejects a missing group and counts how many", () => {
    assert.match(validateVariantCoverage(["a", "b", "c"], ["a"]) ?? "", /thiếu biến thể cho 2 Group/);
  });

  it("rejects a group that was never requested", () => {
    assert.match(validateVariantCoverage(["a"], ["a", "z"]) ?? "", /không nằm trong yêu cầu/);
  });
});
