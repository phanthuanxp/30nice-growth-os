import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  engagementByFormat,
  engagementByHour,
  engagementByPillar,
  suggestNextWeek,
  summarizeGroupOutcomes,
  topPosts,
  totalPerformance,
  weakestPosts,
  type PublishedPostSample,
} from "@/server/social/performance";

function sample(overrides: Partial<PublishedPostSample> = {}): PublishedPostSample {
  return {
    targetId: "tgt_1",
    contentTitle: "Bài mẫu",
    pillar: "education",
    format: "POST",
    publishedAt: new Date("2026-09-01T05:00:00.000Z"),
    engagements: 10,
    reach: 100,
    comments: 0,
    ...overrides,
  };
}

describe("totals", () => {
  it("sums and averages across posts", () => {
    const totals = totalPerformance([
      sample({ engagements: 10, reach: 100, comments: 2 }),
      sample({ engagements: 30, reach: 300, comments: 4 }),
    ]);
    assert.equal(totals.posts, 2);
    assert.equal(totals.engagements, 40);
    assert.equal(totals.reach, 400);
    assert.equal(totals.comments, 6);
    assert.equal(totals.averageEngagement, 20);
    assert.equal(totals.engagementRate, 10);
  });

  it("does not divide by zero on an empty or reachless set", () => {
    assert.deepEqual(totalPerformance([]), { posts: 0, engagements: 0, reach: 0, comments: 0, averageEngagement: 0, engagementRate: null });
    assert.equal(totalPerformance([sample({ reach: 0 })]).engagementRate, null);
  });
});

describe("dimension breakdowns", () => {
  it("ranks pillars by average engagement, not raw totals", () => {
    const stats = engagementByPillar([
      sample({ pillar: "trust", engagements: 100 }),
      sample({ pillar: "education", engagements: 10 }),
      sample({ pillar: "education", engagements: 10 }),
      sample({ pillar: "education", engagements: 10 }),
    ]);
    assert.equal(stats[0].key, "trust");
    assert.equal(stats[0].averageEngagement, 100);
    assert.equal(stats[1].key, "education");
    assert.equal(stats[1].posts, 3);
    assert.equal(stats[1].engagements, 30);
  });

  it("labels posts with no pillar rather than dropping them", () => {
    const stats = engagementByPillar([sample({ pillar: null })]);
    assert.equal(stats[0].key, "chưa phân loại");
  });

  it("breaks down by format", () => {
    const stats = engagementByFormat([
      sample({ format: "REEL", engagements: 50 }),
      sample({ format: "POST", engagements: 5 }),
    ]);
    assert.deepEqual(stats.map((stat) => stat.key), ["REEL", "POST"]);
  });

  it("buckets posting hours in the workspace's own offset", () => {
    // 05:00 UTC is 12:00 in UTC+7.
    const stats = engagementByHour([sample({ publishedAt: new Date("2026-09-01T05:00:00.000Z") })], 7);
    assert.equal(stats[0].key, "12");
  });

  it("wraps past midnight when the offset pushes into the next day", () => {
    const stats = engagementByHour([sample({ publishedAt: new Date("2026-09-01T20:00:00.000Z") })], 7);
    assert.equal(stats[0].key, "03");
  });

  it("reports engagement rate only when reach is known", () => {
    const [withReach] = engagementByPillar([sample({ engagements: 5, reach: 200 })]);
    assert.equal(withReach.engagementRate, 2.5);
    const [withoutReach] = engagementByPillar([sample({ engagements: 5, reach: 0 })]);
    assert.equal(withoutReach.engagementRate, null);
  });
});

describe("post rankings", () => {
  const samples = [
    sample({ targetId: "a", engagements: 5 }),
    sample({ targetId: "b", engagements: 50 }),
    sample({ targetId: "c", engagements: 25 }),
  ];

  it("returns the strongest and weakest posts", () => {
    assert.deepEqual(topPosts(samples, 2).map((item) => item.targetId), ["b", "c"]);
    assert.deepEqual(weakestPosts(samples, 2).map((item) => item.targetId), ["a", "c"]);
  });

  it("does not mutate the input", () => {
    topPosts(samples);
    assert.equal(samples[0].targetId, "a");
  });
});

describe("next-week suggestions", () => {
  it("asks for more data rather than guessing from two posts", () => {
    const suggestions = suggestNextWeek([sample(), sample()], 7);
    assert.equal(suggestions.length, 1);
    assert.match(suggestions[0].headline, /Cần thêm dữ liệu/);
  });

  it("recommends the stronger pillar with the numbers behind it", () => {
    const samples = [
      ...Array.from({ length: 3 }, () => sample({ pillar: "trust", engagements: 90 })),
      ...Array.from({ length: 3 }, () => sample({ pillar: "conversion", engagements: 5 })),
    ];
    const suggestion = suggestNextWeek(samples, 7).find((item) => item.headline.includes("nhóm nội dung"));
    assert.ok(suggestion);
    assert.match(suggestion.headline, /trust/);
    assert.match(suggestion.evidence, /90 tương tác\/bài trên 3 bài/);
  });

  it("ignores a pillar with too few posts to judge", () => {
    const samples = [
      ...Array.from({ length: 4 }, () => sample({ pillar: "education", engagements: 10 })),
      sample({ pillar: "viral-luck", engagements: 5000 }),
    ];
    const suggestion = suggestNextWeek(samples, 7).find((item) => item.headline.includes("nhóm nội dung"));
    assert.equal(suggestion, undefined);
  });

  it("surfaces posts that are generating conversation", () => {
    const samples = [
      ...Array.from({ length: 3 }, () => sample({ engagements: 10 })),
      sample({ contentTitle: "Hỏi đáp Hà Giang", engagements: 40, comments: 12 }),
    ];
    const suggestion = suggestNextWeek(samples, 7).find((item) => item.headline.includes("bình luận"));
    assert.ok(suggestion);
    assert.match(suggestion.detail, /Hỏi đáp Hà Giang/);
  });

  it("says so plainly when nothing separates the groups", () => {
    const samples = Array.from({ length: 4 }, () => sample({ engagements: 10, comments: 0 }));
    const suggestions = suggestNextWeek(samples, 7);
    assert.equal(suggestions.length, 1);
    assert.match(suggestions[0].headline, /Chưa thấy khác biệt/);
  });

  it("always attaches evidence to every suggestion", () => {
    const samples = [
      ...Array.from({ length: 3 }, () => sample({ pillar: "trust", format: "REEL", engagements: 90, comments: 3 })),
      ...Array.from({ length: 3 }, () => sample({ pillar: "conversion", format: "POST", engagements: 5 })),
    ];
    for (const suggestion of suggestNextWeek(samples, 7)) {
      assert.ok(suggestion.evidence.length > 0, suggestion.headline);
    }
  });
});

describe("group outcomes", () => {
  it("counts each status per group and ranks by posts actually published", () => {
    const outcomes = summarizeGroupOutcomes([
      { groupName: "Group A", status: "PUBLISHED" },
      { groupName: "Group A", status: "MANUAL_REQUIRED" },
      { groupName: "Group B", status: "PUBLISHED" },
      { groupName: "Group B", status: "PUBLISHED" },
      { groupName: "Group B", status: "FAILED" },
      { groupName: "Group C", status: "SKIPPED" },
    ]);
    assert.deepEqual(outcomes.map((row) => row.groupName), ["Group B", "Group A", "Group C"]);
    assert.deepEqual(outcomes[0], { groupName: "Group B", published: 2, manualPending: 0, failed: 1, skipped: 0 });
    assert.deepEqual(outcomes[1], { groupName: "Group A", published: 1, manualPending: 1, failed: 0, skipped: 0 });
    assert.deepEqual(outcomes[2], { groupName: "Group C", published: 0, manualPending: 0, failed: 0, skipped: 1 });
  });

  it("keeps a group that has never been posted to visible", () => {
    const outcomes = summarizeGroupOutcomes([{ groupName: "Group im lặng", status: "DRAFT" }]);
    assert.deepEqual(outcomes[0], { groupName: "Group im lặng", published: 0, manualPending: 0, failed: 0, skipped: 0 });
  });

  it("returns nothing for no targets", () => {
    assert.deepEqual(summarizeGroupOutcomes([]), []);
  });
});
