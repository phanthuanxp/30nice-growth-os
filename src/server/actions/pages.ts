"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuth } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { createPage, updatePage, deletePage, getPageById } from "@/server/queries/pages";
import { requireTenantAccess } from "@/server/permissions/guard";
import { snapshotPageRevision } from "@/server/cms/revisions";

const pageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).regex(/^[a-z0-9-/]*$/, "Chỉ dùng chữ thường, số, dấu gạch ngang"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  summary: z.string().max(500).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  uiBlocksJson: z.string().optional(),
});

export type PageFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};

function parseBlocks(json?: string): unknown {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

export async function createPageAction(
  _prev: PageFormState,
  formData: FormData
): Promise<PageFormState> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  const tenantId = formData.get("tenantId") as string;
  if (!tenantId) return { error: "Vui lòng chọn site" };
  await requireTenantAccess(tenantId, "EDITOR");

  const raw = Object.fromEntries(formData);
  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const page = await createPage(tenantId, {
      ...parsed.data,
      uiBlocks: parseBlocks(parsed.data.uiBlocksJson),
    });
    await snapshotPageRevision(page.id, user.id);
    revalidatePath("/admin/pages");
    return { success: true, id: page.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    if (msg.includes("Unique constraint")) return { error: "Slug đã tồn tại trong site này" };
    return { error: msg };
  }
}

export async function updatePageAction(
  id: string,
  _prev: PageFormState,
  formData: FormData
): Promise<PageFormState> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  const raw = Object.fromEntries(formData);
  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const existing = await getPageById(id);
    if (!existing) return { error: "Không tìm thấy trang" };
    await requireTenantAccess(existing.tenantId, "EDITOR");
    await updatePage(id, {
      ...parsed.data,
      uiBlocks: parseBlocks(parsed.data.uiBlocksJson),
    });
    await snapshotPageRevision(id, user.id);
    revalidatePath("/admin/pages");
    revalidatePath(`/admin/pages/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi cập nhật" };
  }
}

export async function deletePageAction(id: string): Promise<{ error?: string }> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  try {
    await deletePage(id);
    revalidatePath("/admin/pages");
    redirect("/admin/pages");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi xóa" };
  }
}

export async function deleteSitePageAction(siteId: string, id: string): Promise<{ error?: string }> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  try {
    await deletePage(id);
    revalidatePath(`/admin/sites/${siteId}/pages`);
    redirect(`/admin/sites/${siteId}/pages`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi xóa" };
  }
}
