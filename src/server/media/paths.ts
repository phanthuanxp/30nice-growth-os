import path from "node:path";

/** Root directory that every uploaded file must live under. */
export function uploadsRoot() {
  return path.join(process.cwd(), "public", "uploads");
}

/**
 * Resolve untrusted path segments against the uploads root.
 *
 * Returns `null` when the segments would escape the root. `path.join` collapses
 * `..` before the check, so a bare `startsWith(root)` test would also accept a
 * sibling directory such as `public/uploads-backup`; comparing the relative path
 * instead keeps the containment strict.
 */
export function resolveUploadPath(segments: string[]): string | null {
  if (segments.length === 0 || segments.some((segment) => !segment)) return null;
  const root = uploadsRoot();
  const resolved = path.resolve(root, ...segments);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolved;
}

/** Uploaded filenames are rewritten to this shape; reject anything else. */
export function safeFilename(originalName: string): string {
  const cleaned = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "_").slice(0, 120);
  return cleaned || "file";
}
