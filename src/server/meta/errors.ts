import { MetaApiError } from "@/server/meta/client";

export type MetaErrorStatus =
  | "token_expired"
  | "permission_missing"
  | "reconnect_required"
  | "page_access_lost"
  | "rate_limited"
  | "unknown";

export type NormalizedMetaError = {
  status: MetaErrorStatus;
  message: string;
  code?: number;
  subcode?: number;
  traceId?: string;
};

const EXPIRED_SUBCODES = new Set([463, 467, 490, 492]);
const PERMISSION_CODES = new Set([10, 200, 294, 298]);
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613]);
const PAGE_ACCESS_CODES = new Set([100, 190, 803]);

export function normalizeMetaError(error: unknown): NormalizedMetaError {
  if (!(error instanceof MetaApiError)) {
    return { status: "unknown", message: error instanceof Error ? error.message : "Unknown Meta error" };
  }

  const text = error.message.toLowerCase();
  let status: MetaErrorStatus = "unknown";

  if (error.subcode && EXPIRED_SUBCODES.has(error.subcode)) status = "token_expired";
  else if (error.code && RATE_LIMIT_CODES.has(error.code)) status = "rate_limited";
  else if (error.code && PERMISSION_CODES.has(error.code)) status = "permission_missing";
  else if (error.code && PAGE_ACCESS_CODES.has(error.code) && /page|object|permission|access/.test(text)) status = "page_access_lost";
  else if (error.code === 190 || /session|token|oauth|reconnect|expired/.test(text)) status = "reconnect_required";

  return { status, message: error.message, code: error.code, subcode: error.subcode, traceId: error.traceId };
}

export function metaErrorHttpStatus(status: MetaErrorStatus) {
  switch (status) {
    case "token_expired":
    case "reconnect_required":
    case "page_access_lost":
      return 409;
    case "permission_missing":
      return 403;
    case "rate_limited":
      return 429;
    default:
      return 502;
  }
}
