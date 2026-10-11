/**
 * Helpers for reading JSON back out of a model response.
 *
 * Models wrap JSON in markdown fences or add a sentence of preamble even when
 * told not to, so the fence is stripped and the outermost braces are used as
 * the real boundaries.
 */

const FENCE_START = /^```[a-z]*\s*/i;
const FENCE_END = /```\s*$/;

/** Returns the JSON object substring, or the cleaned text when no braces are found. */
export function stripJsonFence(text: string): string {
  const cleaned = text.trim().replace(FENCE_START, "").replace(FENCE_END, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
}

/** Parses a model response into an object, throwing when it contains none. */
export function parseJsonObject(text: string): unknown {
  const cleaned = text.trim().replace(FENCE_START, "").replace(FENCE_END, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("AI không trả về JSON hợp lệ");
  return JSON.parse(cleaned.slice(start, end + 1));
}
