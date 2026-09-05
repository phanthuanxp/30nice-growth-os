/**
 * Turning published posts into the weekly reporting loop the spec asks for.
 *
 * Deliberately deterministic rather than an AI call: the operator gets the same
 * answer twice from the same data, the ranking can be tested, and reporting
 * costs nothing to open.
 */

export interface PublishedPostSample {
  targetId: string;
  contentTitle: string;
  pillar: string | null;
  format: string;
  publishedAt: Date;
  engagements: number;
  reach: number;
  /** Incoming comments, excluding the Page's own replies. */
  comments: number;
}

export interface DimensionStat {
  key: string;
  posts: number;
  engagements: number;
  /** Mean engagements per post, rounded to one decimal. */
  averageEngagement: number;
  /** Engagements per hundred people reached; null when reach is unknown. */
  engagementRate: number | null;
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function summarize(key: string, samples: PublishedPostSample[]): DimensionStat {
  const engagements = samples.reduce((sum, sample) => sum + sample.engagements, 0);
  const reach = samples.reduce((sum, sample) => sum + sample.reach, 0);
  return {
    key,
    posts: samples.length,
    engagements,
    averageEngagement: round(engagements / samples.length),
    engagementRate: reach > 0 ? round((engagements / reach) * 100, 2) : null,
  };
}

function groupBy(samples: PublishedPostSample[], pick: (sample: PublishedPostSample) => string): DimensionStat[] {
  const buckets = new Map<string, PublishedPostSample[]>();
  for (const sample of samples) {
    const key = pick(sample);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(sample);
    else buckets.set(key, [sample]);
  }
  return [...buckets.entries()]
    .map(([key, bucket]) => summarize(key, bucket))
    .sort((a, b) => b.averageEngagement - a.averageEngagement || b.posts - a.posts || a.key.localeCompare(b.key));
}

export function engagementByPillar(samples: PublishedPostSample[]): DimensionStat[] {
  return groupBy(samples, (sample) => sample.pillar || "chưa phân loại");
}

export function engagementByFormat(samples: PublishedPostSample[]): DimensionStat[] {
  return groupBy(samples, (sample) => sample.format);
}

/**
 * Best hours to post, in the given UTC offset.
 *
 * Hours with a single post are kept but rank below busier ones, so one lucky
 * post does not become the recommendation.
 */
export function engagementByHour(samples: PublishedPostSample[], offsetHours: number): DimensionStat[] {
  return groupBy(samples, (sample) => {
    const local = new Date(sample.publishedAt.getTime() + offsetHours * 60 * 60_000);
    return String(local.getUTCHours()).padStart(2, "0");
  });
}

export interface PerformanceTotals {
  posts: number;
  engagements: number;
  reach: number;
  comments: number;
  averageEngagement: number;
  engagementRate: number | null;
}

export function totalPerformance(samples: PublishedPostSample[]): PerformanceTotals {
  const engagements = samples.reduce((sum, sample) => sum + sample.engagements, 0);
  const reach = samples.reduce((sum, sample) => sum + sample.reach, 0);
  const comments = samples.reduce((sum, sample) => sum + sample.comments, 0);
  return {
    posts: samples.length,
    engagements,
    reach,
    comments,
    averageEngagement: samples.length ? round(engagements / samples.length) : 0,
    engagementRate: reach > 0 ? round((engagements / reach) * 100, 2) : null,
  };
}

/** Generic over the row type so callers keep any extra fields they carry. */
export function topPosts<T extends PublishedPostSample>(samples: T[], count = 5): T[] {
  return [...samples]
    .sort((a, b) => b.engagements - a.engagements || b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, count);
}

export function weakestPosts<T extends PublishedPostSample>(samples: T[], count = 5): T[] {
  return [...samples]
    .sort((a, b) => a.engagements - b.engagements || b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, count);
}

export interface ContentSuggestion {
  /** What to do, phrased for the operator. */
  headline: string;
  detail: string;
  /** Evidence the suggestion rests on, so it can be argued with. */
  evidence: string;
}

/** A dimension needs this many posts before it is worth recommending on. */
const MIN_POSTS_FOR_CONFIDENCE = 3;

/**
 * Suggest what to post next week, from what actually performed.
 *
 * Every suggestion states the evidence behind it. A dimension with too few
 * posts produces no suggestion rather than a confident-sounding guess.
 */
export function suggestNextWeek(samples: PublishedPostSample[], offsetHours: number): ContentSuggestion[] {
  if (samples.length < MIN_POSTS_FOR_CONFIDENCE) {
    return [{
      headline: "Cần thêm dữ liệu",
      detail: `Mới có ${samples.length} bài đã đăng kèm số liệu. Hãy duy trì lịch đăng thêm ít nhất ${MIN_POSTS_FOR_CONFIDENCE - samples.length} bài nữa trước khi tối ưu theo dữ liệu.`,
      evidence: "Số bài hiện tại quá ít để so sánh giữa các nhóm.",
    }];
  }

  const suggestions: ContentSuggestion[] = [];

  const pillars = engagementByPillar(samples).filter((stat) => stat.posts >= MIN_POSTS_FOR_CONFIDENCE);
  if (pillars.length >= 2) {
    const best = pillars[0];
    const worst = pillars[pillars.length - 1];
    if (best.averageEngagement > worst.averageEngagement) {
      suggestions.push({
        headline: `Tăng tỷ trọng nhóm nội dung "${best.key}"`,
        detail: `Nhóm "${best.key}" đang hiệu quả hơn "${worst.key}". Tuần sau nên tăng số bài thuộc "${best.key}" và giảm bớt "${worst.key}".`,
        evidence: `${best.key}: ${best.averageEngagement} tương tác/bài trên ${best.posts} bài · ${worst.key}: ${worst.averageEngagement} tương tác/bài trên ${worst.posts} bài.`,
      });
    }
  }

  const formats = engagementByFormat(samples).filter((stat) => stat.posts >= MIN_POSTS_FOR_CONFIDENCE);
  if (formats.length >= 2 && formats[0].averageEngagement > formats[formats.length - 1].averageEngagement) {
    suggestions.push({
      headline: `Ưu tiên định dạng ${formats[0].key}`,
      detail: `Định dạng ${formats[0].key} đang cho tương tác tốt nhất. Hãy chuyển bớt nội dung tuần sau sang định dạng này.`,
      evidence: `${formats[0].key}: ${formats[0].averageEngagement} tương tác/bài trên ${formats[0].posts} bài.`,
    });
  }

  const hours = engagementByHour(samples, offsetHours).filter((stat) => stat.posts >= 2);
  if (hours.length >= 2) {
    suggestions.push({
      headline: `Đăng quanh khung ${hours[0].key}:00`,
      detail: `Khung giờ ${hours[0].key}:00 đang cho tương tác cao nhất. Hãy xếp các bài quan trọng vào khung này.`,
      evidence: `${hours[0].key}:00 — ${hours[0].averageEngagement} tương tác/bài trên ${hours[0].posts} bài.`,
    });
  }

  const withComments = samples.filter((sample) => sample.comments > 0);
  if (withComments.length) {
    const best = topPosts(withComments, 1)[0];
    suggestions.push({
      headline: "Khai thác lại chủ đề đang có bình luận",
      detail: `Bài "${best.contentTitle}" đang tạo hội thoại. Hãy viết bài tiếp nối cùng chủ đề và trả lời hết bình luận còn tồn.`,
      evidence: `${withComments.length} bài có bình luận, cao nhất là "${best.contentTitle}" với ${best.comments} bình luận.`,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      headline: "Chưa thấy khác biệt rõ giữa các nhóm",
      detail: "Hiệu quả giữa các pillar và định dạng đang tương đương. Hãy giữ nguyên tỷ trọng hiện tại và thử thay đổi hook hoặc hình ảnh.",
      evidence: `Đã so sánh trên ${samples.length} bài đã đăng.`,
    });
  }

  return suggestions;
}

export interface GroupOutcomeInput {
  groupName: string;
  status: string;
}

export interface GroupOutcome {
  groupName: string;
  published: number;
  manualPending: number;
  failed: number;
  skipped: number;
}

/** Distribution outcomes per group, so a group that never actually gets posted shows up. */
export function summarizeGroupOutcomes(targets: GroupOutcomeInput[]): GroupOutcome[] {
  const buckets = new Map<string, GroupOutcome>();
  for (const target of targets) {
    const row = buckets.get(target.groupName) ?? { groupName: target.groupName, published: 0, manualPending: 0, failed: 0, skipped: 0 };
    if (target.status === "PUBLISHED") row.published += 1;
    else if (target.status === "MANUAL_REQUIRED") row.manualPending += 1;
    else if (target.status === "FAILED") row.failed += 1;
    else if (target.status === "SKIPPED") row.skipped += 1;
    buckets.set(target.groupName, row);
  }
  return [...buckets.values()].sort((a, b) => b.published - a.published || a.groupName.localeCompare(b.groupName));
}
