import { z } from "zod";

/**
 * Parsing for the `feed` webhook Meta sends for a subscribed Page.
 *
 * Kept pure and separate from the database so the shapes Meta actually sends —
 * which vary by item type and change between Graph versions — can be pinned
 * down in tests.
 */

/** What the change is about. Anything else is ignored rather than guessed at. */
export type FeedItemType = "comment" | "post" | "status" | "photo" | "video" | "share" | "reaction";

export type FeedVerb = "add" | "edited" | "remove" | "hide" | "unhide";

export interface FeedEvent {
  item: FeedItemType;
  verb: FeedVerb;
  /** `{pageId}_{postId}`. Present on every event worth storing. */
  postId: string;
  /** Only for comment events. */
  commentId: string | null;
  parentId: string | null;
  message: string | null;
  authorId: string | null;
  authorName: string | null;
  postedAt: Date;
}

const ITEM_TYPES = new Set<FeedItemType>(["comment", "post", "status", "photo", "video", "share", "reaction"]);
const VERBS = new Set<FeedVerb>(["add", "edited", "remove", "hide", "unhide"]);

const feedValueSchema = z.object({
  item: z.string().optional(),
  verb: z.string().optional(),
  post_id: z.string().optional(),
  comment_id: z.string().optional(),
  parent_id: z.string().optional(),
  message: z.string().optional(),
  created_time: z.number().optional(),
  from: z.object({ id: z.string().optional(), name: z.string().optional() }).optional(),
});

/** The stored row wraps the change in `{ value: ... }`; unwrap either shape. */
function unwrap(payload: unknown): unknown {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && "value" in payload) {
    return (payload as { value: unknown }).value;
  }
  return payload;
}

/**
 * Turn a stored webhook payload into a feed event, or `null` when it is not one
 * this system handles. Returning null is normal: Meta sends fields and item
 * types beyond the ones we act on.
 */
export function parseFeedEvent(payload: unknown, receivedAt: Date = new Date()): FeedEvent | null {
  const parsed = feedValueSchema.safeParse(unwrap(payload));
  if (!parsed.success) return null;
  const value = parsed.data;

  const item = value.item as FeedItemType | undefined;
  const verb = value.verb as FeedVerb | undefined;
  if (!item || !ITEM_TYPES.has(item)) return null;
  if (!verb || !VERBS.has(verb)) return null;

  // A comment event carries its own id; without a post id there is nothing to
  // attach it to, so the event is dropped rather than stored orphaned.
  const postId = value.post_id?.trim();
  if (!postId) return null;

  // created_time is seconds since the epoch. Meta omits it on some removals.
  const postedAt = value.created_time && value.created_time > 0
    ? new Date(value.created_time * 1000)
    : receivedAt;

  return {
    item,
    verb,
    postId,
    commentId: value.comment_id?.trim() || null,
    parentId: value.parent_id?.trim() || null,
    message: value.message ?? null,
    authorId: value.from?.id ?? null,
    authorName: value.from?.name ?? null,
    postedAt,
  };
}

/** Only comment events produce a stored row; posts and reactions are counted elsewhere. */
export function isStorableComment(event: FeedEvent): boolean {
  return event.item === "comment" && Boolean(event.commentId);
}

/**
 * Whether the comment came from the Page itself.
 *
 * Meta reports the Page's own replies through the same feed, and counting them
 * as incoming engagement would make every conversation look twice as busy.
 */
export function isAuthoredByPage(event: FeedEvent, externalPageId: string | null): boolean {
  return Boolean(externalPageId && event.authorId && event.authorId === externalPageId);
}
