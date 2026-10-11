import { MetaApiError } from "@/server/meta/client";

export interface MetaFailureClassification {
  permanent: boolean;
  code: number | null;
  message: string;
  traceId?: string;
}

/** Graph API errors worth another attempt: transient, throttling or timeout. */
const RETRYABLE_CODES = new Set([1, 2, 4, 17, 32, 613]);
/** Errors a retry can never fix: bad permissions, invalid or expired token. */
const PERMANENT_CODES = new Set([10, 100, 190, 200]);

/** Maximum backoff between publish attempts, in minutes. */
export const MAX_RETRY_DELAY_MINUTES = 60;

/** Builds the message body posted to Facebook from an approved content row. */
export function buildPostMessage(content: {
  caption: string | null;
  callToAction: string | null;
  hashtags: string[];
}): string {
  return [content.caption?.trim(), content.callToAction?.trim(), content.hashtags.join(" ")]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

/**
 * Decide whether a failed publish may be retried.
 *
 * Anything that is not a recognised, explicitly retryable Graph error is treated
 * as permanent, so an unknown failure stops the queue instead of hammering Meta.
 */
export function classifyMetaFailure(error: unknown): MetaFailureClassification {
  if (!(error instanceof MetaApiError)) {
    return { permanent: true, code: null, message: "Lỗi publisher không xác định" };
  }
  const permanent =
    error.code === undefined || PERMANENT_CODES.has(error.code) || !RETRYABLE_CODES.has(error.code);
  return {
    permanent,
    code: error.code ?? null,
    message: error.message.slice(0, 1000),
    traceId: error.traceId,
  };
}

/** Exponential backoff (2, 4, 8 … minutes) capped at an hour. */
export function nextRetryAt(attempt: number, now: Date = new Date()): Date {
  const minutes = Math.min(MAX_RETRY_DELAY_MINUTES, 2 ** Math.max(1, attempt));
  return new Date(now.getTime() + minutes * 60_000);
}

/** Facebook post ids are `{pageId}_{postId}`; the permalink splits on that underscore. */
export function metaPostUrl(pagePostId: string): string {
  return `https://www.facebook.com/${pagePostId.replace("_", "/posts/")}`;
}
