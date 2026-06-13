"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuth } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { createPost, updatePost, deletePost, getPostById } from "@/server/queries/posts";
import { requireTenantAccess } from "@/server/permissions/guard";
import { snapshotPostRevision } from "@/server/cms/revisions";
import { prisma } from "@/server/db";

const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số, dấu gạch ngang"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  featuredImage: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  ogTitle: z.string().max(200).optional(),
  ogDescription: z.string().max(500).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
  twitterCard: z.string().max(50).optional(),
  schemaType: z.string().max(50).optional(),
  schemaData: z.string().optional(),
  robotsMeta: z.string().max(100).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  publishedAt: z.string().optional(),
});

export type PostFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};

export async function createPostAction(
  _prev: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  const tenantId = formData.get("tenantId") as string;
  if (!tenantId) return { error: "Vui lòng chọn site" };
  await requireTenantAccess(tenantId, "EDITOR");

  const raw = Object.fromEntries(formData);
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const resolvedPublishedAt =
      parsed.data.status === "PUBLISHED"
        ? parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : new Date()
        : null;
    const post = await createPost(tenantId, {
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
      publishedAt: resolvedPublishedAt,
    });
    await snapshotPostRevision(post.id, user.id);
    revalidatePath("/admin/blog");
    return { success: true, id: post.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    if (msg.includes("Unique constraint")) return { error: "Slug đã tồn tại trong site này" };
    return { error: msg };
  }
}

export async function updatePostAction(
  id: string,
  _prev: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  const raw = Object.fromEntries(formData);
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const resolvedPublishedAt =
      parsed.data.status === "PUBLISHED"
        ? parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : new Date()
        : null;
    const existing = await getPostById(id);
    if (!existing) return { error: "Không tìm thấy bài viết" };
    await requireTenantAccess(existing.tenantId, "EDITOR");
    await updatePost(id, {
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
      publishedAt: resolvedPublishedAt,
    });
    await snapshotPostRevision(id, user.id);
    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi cập nhật" };
  }
}

export async function deletePostAction(id: string): Promise<{ error?: string }> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  try {
    await deletePost(id);
    revalidatePath("/admin/blog");
    redirect("/admin/blog");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi xóa" };
  }
}

export async function deleteSitePostAction(siteId: string, id: string): Promise<{ error?: string }> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  try {
    await deletePost(id);
    revalidatePath(`/admin/sites/${siteId}/blog`);
    redirect(`/admin/sites/${siteId}/blog`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi xóa" };
  }
}

export type CategoryActionState = { success?: boolean; error?: string; id?: string };

export async function createCategoryAction(
  tenantId: string,
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  await requireTenantAccess(tenantId, "EDITOR");

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Tên danh mục không được trống" };

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    const cat = await prisma.category.create({ data: { tenantId, name, slug } });
    revalidatePath("/admin/blog");
    return { success: true, id: cat.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    if (msg.includes("Unique constraint")) return { error: "Danh mục đã tồn tại" };
    return { error: msg };
  }
}

export async function deleteCategoryAction(id: string): Promise<{ error?: string }> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/blog");
    return {};
  } catch {
    return { error: "Không thể xóa danh mục (có bài viết đang dùng)" };
  }
}
