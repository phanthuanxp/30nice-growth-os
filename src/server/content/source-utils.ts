import crypto from "node:crypto";

export function normalizeSourceUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return trimmed;
  }
}

export function splitUrlList(value: string) {
  return value.split(/[\n,]+/).map(normalizeSourceUrl).filter(Boolean);
}

export function hashContent(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function guessTitleFromUrl(url: string) {
  try {
    const u = new URL(url);
    const slug = u.pathname.split("/").filter(Boolean).pop() || u.hostname;
    return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}
