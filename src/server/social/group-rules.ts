/**
 * Guardrails for distributing a post into Facebook Groups.
 *
 * Everything here is pure so the rules can be tested directly and applied twice:
 * once when the queue is built, and again at publish time, since a group can be
 * paused or hit its daily limit in between.
 */

/** Graph permission required to post into a group on a page's behalf. */
export const META_GROUP_PUBLISH_SCOPE = "publish_to_groups";

/** Default spacing between two group posts of the same content, in minutes. */
export const DEFAULT_GROUP_SPACING_MINUTES = 45;

export type SocialGroupStatusValue = "CANDIDATE" | "APPROVED" | "PAUSED" | "REJECTED";
export type SocialGroupModeValue = "MANUAL_ONLY" | "API_ALLOWED" | "DISABLED";

export interface GroupRuleSnapshot {
  id: string;
  name: string;
  status: SocialGroupStatusValue;
  mode: SocialGroupModeValue;
  topics: string[];
  dailyPostLimit: number;
  cooldownHours: number;
  allowLinks: boolean;
  allowPromotion: boolean;
  apiVerifiedAt: Date | null;
}

export interface GroupActivity {
  /** Posts already published into this group inside the current calendar day. */
  postsToday: number;
  lastPostedAt: Date | null;
}

export interface GroupEligibility {
  allowed: boolean;
  /** Why the group was rejected. Shown to the operator and stored on the target. */
  reason?: string;
  /** Non-blocking notes, e.g. a weak topic match worth a human look. */
  warnings: string[];
}

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi;
/** Bare domains such as "30nice.vn/lien-he" that carry no scheme. */
const BARE_DOMAIN_PATTERN = /\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.(?:com|net|org|vn|io|co|info|biz|shop|store|online|site|xyz)(?:\/\S*)?/gi;

/**
 * Phrases that read as a sales push. Groups that ban promotion usually ban these
 * outright, so the caption is rewritten rather than silently posted.
 */
const PROMOTION_PATTERNS = [
  /\b(?:giá|gia)\s*(?:chỉ|chi|từ|tu)?\s*[\d.,]+\s*(?:k|đ|d|vnd|nghìn|nghin|triệu|trieu)\b/gi,
  /\b(?:khuyến\s*mãi|khuyen\s*mai|ưu\s*đãi|uu\s*dai|giảm\s*giá|giam\s*gia|sale|deal|combo|báo\s*giá|bao\s*gia)\b/gi,
  /\b(?:đặt\s*(?:ngay|lịch|xe|hàng)|dat\s*(?:ngay|lich|xe|hang)|inbox\s*(?:ngay|để|de)|liên\s*hệ\s*ngay|lien\s*he\s*ngay|gọi\s*ngay|goi\s*ngay)\b/gi,
  /\b(?:hotline|zalo|0\d{8,10})\b/gi,
];

export function containsLink(text: string): boolean {
  URL_PATTERN.lastIndex = 0;
  BARE_DOMAIN_PATTERN.lastIndex = 0;
  return URL_PATTERN.test(text) || BARE_DOMAIN_PATTERN.test(text);
}

export function containsPromotion(text: string): boolean {
  return PROMOTION_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

function collapseWhitespace(text: string): string {
  return text.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export interface SanitizedCaption {
  caption: string;
  /** What had to be removed, so the UI can tell the operator why it differs. */
  removed: string[];
}

/**
 * Strip whatever a group's rules forbid.
 *
 * The AI is already told the constraints, but a human edit or a stale variant
 * can reintroduce a banned link, so this runs unconditionally before queueing.
 */
export function sanitizeGroupCaption(caption: string, group: Pick<GroupRuleSnapshot, "allowLinks" | "allowPromotion">): SanitizedCaption {
  const removed: string[] = [];
  let result = caption;

  if (!group.allowLinks && containsLink(result)) {
    result = result.replace(URL_PATTERN, "").replace(BARE_DOMAIN_PATTERN, "");
    removed.push("liên kết");
  }

  if (!group.allowPromotion) {
    let strippedPromotion = false;
    for (const pattern of PROMOTION_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(result)) {
        pattern.lastIndex = 0;
        result = result.replace(pattern, "");
        strippedPromotion = true;
      }
    }
    if (strippedPromotion) removed.push("nội dung chào bán");
  }

  return { caption: collapseWhitespace(result), removed };
}

/** Whether the content's topics overlap the group's declared interests. */
export function topicsOverlap(groupTopics: string[], contentTopics: string[]): boolean {
  if (groupTopics.length === 0) return true;
  const haystack = contentTopics.map((topic) => topic.toLowerCase());
  return groupTopics.some((topic) => {
    const needle = topic.trim().toLowerCase();
    if (!needle) return false;
    return haystack.some((value) => value.includes(needle) || needle.includes(value));
  });
}

/**
 * Decide whether a post may be queued for a group right now.
 *
 * Order matters: the hard stops (never approved, disabled, over limit, still in
 * cooldown) come first so the reason shown is the one the operator must fix.
 */
export function evaluateGroupDistribution(input: {
  group: GroupRuleSnapshot;
  activity: GroupActivity;
  contentTopics?: string[];
  now: Date;
}): GroupEligibility {
  const { group, activity, now } = input;
  const warnings: string[] = [];

  if (group.status !== "APPROVED") {
    return { allowed: false, reason: `Group đang ở trạng thái ${group.status}, cần được duyệt trước khi phân phối`, warnings };
  }
  if (group.mode === "DISABLED") {
    return { allowed: false, reason: "Group đang bị tắt phân phối", warnings };
  }
  if (group.dailyPostLimit <= 0) {
    return { allowed: false, reason: "Group đặt giới hạn 0 bài/ngày", warnings };
  }
  if (activity.postsToday >= group.dailyPostLimit) {
    return { allowed: false, reason: `Group đã đạt giới hạn ${group.dailyPostLimit} bài/ngày`, warnings };
  }
  if (activity.lastPostedAt && group.cooldownHours > 0) {
    const readyAt = new Date(activity.lastPostedAt.getTime() + group.cooldownHours * 60 * 60_000);
    if (readyAt > now) {
      return { allowed: false, reason: `Cần giãn ${group.cooldownHours} giờ giữa hai bài, có thể đăng lại sau ${readyAt.toISOString()}`, warnings };
    }
  }

  if (input.contentTopics?.length && !topicsOverlap(group.topics, input.contentTopics)) {
    warnings.push("Chủ đề bài viết không khớp chủ đề khai báo của Group");
  }
  if (group.mode === "API_ALLOWED" && !group.apiVerifiedAt) {
    warnings.push("Group bật API nhưng chưa xác minh quyền, sẽ chuyển sang đăng thủ công");
  }

  return { allowed: true, warnings };
}

export type GroupPublishRoute = "API" | "MANUAL";

/**
 * Only a group that is approved, explicitly switched to API mode, verified, and
 * backed by a token carrying the publish scope is posted to automatically.
 * Everything else goes to a person.
 */
export function resolveGroupPublishRoute(
  group: Pick<GroupRuleSnapshot, "status" | "mode" | "apiVerifiedAt">,
  grantedScopes: readonly string[],
): GroupPublishRoute {
  if (group.status !== "APPROVED") return "MANUAL";
  if (group.mode !== "API_ALLOWED") return "MANUAL";
  if (!group.apiVerifiedAt) return "MANUAL";
  if (!grantedScopes.includes(META_GROUP_PUBLISH_SCOPE)) return "MANUAL";
  return "API";
}

/** Comparison key for spotting the same caption reused across groups. */
export function captionFingerprint(caption: string): string {
  return caption
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Groups that would receive an identical caption, grouped together.
 *
 * Posting the same text into several groups is what gets an account flagged, so
 * the queue refuses to be built until each variant is distinct.
 */
export function findDuplicateCaptionGroups(entries: { groupId: string; caption: string }[]): string[][] {
  const byFingerprint = new Map<string, string[]>();
  for (const entry of entries) {
    const key = captionFingerprint(entry.caption);
    if (!key) continue;
    const bucket = byFingerprint.get(key);
    if (bucket) bucket.push(entry.groupId);
    else byFingerprint.set(key, [entry.groupId]);
  }
  return [...byFingerprint.values()].filter((bucket) => bucket.length > 1);
}

/**
 * Space group posts out from a base time so they do not all land at once.
 * `index` is the position within this distribution batch.
 */
export function staggerGroupSchedule(base: Date, index: number, spacingMinutes = DEFAULT_GROUP_SPACING_MINUTES): Date {
  const spacing = Math.max(spacingMinutes, 1);
  return new Date(base.getTime() + index * spacing * 60_000);
}

/** Start of the calendar day in a fixed offset, used for the daily limit window. */
export function startOfDayInOffset(now: Date, offsetHours: number): Date {
  const shifted = new Date(now.getTime() + offsetHours * 60 * 60_000);
  const midnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  return new Date(midnight - offsetHours * 60 * 60_000);
}

/**
 * UTC offset a time zone is on at a given instant, in hours.
 *
 * The daily post limit is a calendar-day rule in the workspace's own time zone,
 * so a fixed +7 would drift for any workspace outside Indochina Time.
 */
export function timezoneOffsetHours(timeZone: string, at: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(at);
    const label = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
    const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(label);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2]) + Number(match[3] ?? 0) / 60);
  } catch {
    // An invalid IANA name must not take the queue down; fall back to UTC.
    return 0;
  }
}

/**
 * Check that the model returned exactly one variant per requested group.
 *
 * Returns the problem as a message rather than throwing so the caller can hand
 * it back to the operator; a partial or duplicated set is never posted.
 */
export function validateVariantCoverage(requestedGroupIds: string[], variantGroupIds: string[]): string | null {
  const requested = new Set(requestedGroupIds);
  const returned = new Set(variantGroupIds);
  if (returned.size !== variantGroupIds.length) return "AI trả về trùng Group trong danh sách biến thể";
  const missing = [...requested].filter((id) => !returned.has(id));
  if (missing.length) return `AI thiếu biến thể cho ${missing.length} Group`;
  const unexpected = [...returned].filter((id) => !requested.has(id));
  if (unexpected.length) return "AI trả về Group không nằm trong yêu cầu";
  return null;
}
