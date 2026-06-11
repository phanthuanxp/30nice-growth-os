"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { importPagesFromWordPress, importPostsFromWordPress } from "@/server/importers/wordpress";

export type ImportFormState = {
  success?: boolean;
  error?: string;
  result?: {
    pages: { imported: number; skipped: number; errors: string[] };
    posts: { imported: number; skipped: number; errors: string[] };
  };
};

export async function runWordPressImportAction(
  _prev: ImportFormState,
  formData: FormData
): Promise<ImportFormState> {
  const user = await requireAuth();
  if (!can(user.role, "AGENCY_ADMIN")) return { error: "Không đủ quyền" };

  const tenantId = formData.get("tenantId") as string;
  const wpBaseUrl = formData.get("wpBaseUrl") as string;
  const importPages = formData.get("importPages") === "on";
  const importPosts = formData.get("importPosts") === "on";

  if (!tenantId) return { error: "Vui lòng chọn site đích" };
  if (!wpBaseUrl) return { error: "Vui lòng nhập WordPress URL" };
  if (!importPages && !importPosts) return { error: "Chọn ít nhất một loại nội dung để nhập" };

  const url = wpBaseUrl.replace(/\/$/, "");

  const pagesResult = importPages
    ? await importPagesFromWordPress(tenantId, url)
    : { ok: true, imported: 0, skipped: 0, errors: [] };

  const postsResult = importPosts
    ? await importPostsFromWordPress(tenantId, url)
    : { ok: true, imported: 0, skipped: 0, errors: [] };

  if (importPages) revalidatePath("/admin/pages");
  if (importPosts) revalidatePath("/admin/blog");

  const hasError = (!pagesResult.ok || !postsResult.ok) && (pagesResult.errors.length > 0 || postsResult.errors.length > 0);

  return {
    success: !hasError,
    result: {
      pages: { imported: pagesResult.imported, skipped: pagesResult.skipped, errors: pagesResult.errors },
      posts: { imported: postsResult.imported, skipped: postsResult.skipped, errors: postsResult.errors },
    },
  };
}
