const DEFAULT_ADMIN_URL = "https://admin.30nice.vn";

export function adminPublicUrl(path: string) {
  const configured = process.env.NEXTAUTH_URL || DEFAULT_ADMIN_URL;
  let base: URL;
  try {
    base = new URL(configured);
  } catch {
    base = new URL(DEFAULT_ADMIN_URL);
  }
  if (process.env.NODE_ENV === "production" && base.protocol !== "https:") base = new URL(DEFAULT_ADMIN_URL);
  return new URL(path.startsWith("/") ? path : `/${path}`, base);
}
