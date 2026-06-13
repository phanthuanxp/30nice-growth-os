"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireTenantAccess } from "@/server/permissions/guard";
import { generateSeoMeta } from "@/server/ai/generate";

export type SeoActionState = { ok?: boolean; error?: string };

// ===== Missing-meta scan & batch AI fill =====

export type MissingMetaItem = {
  id: string;
  resource: "page" | "post";
  title: string;
  missingTitle: boolean;
  missingDescription: boolean;
};

export async function scanMissingMeta(tenantId: string): Promise<MissingMetaItem[]> {
  await requireTenantAccess(tenantId, "EDITOR");
  const [pages, posts] = await Promise.all([
    prisma.page.findMany({
      where: { tenantId, OR: [{ seoTitle: null }, { seoTitle: "" }, { seoDescription: null }, { seoDescription: "" }] },
      select: { id: true, title: true, seoTitle: true, seoDescription: true },
    }),
    prisma.post.findMany({
      where: { tenantId, OR: [{ seoTitle: null }, { seoTitle: "" }, { seoDescription: null }, { seoDescription: "" }] },
      select: { id: true, title: true, seoTitle: true, seoDescription: true },
    }),
  ]);

  return [
    ...pages.map((p) => ({
      id: p.id,
      resource: "page" as const,
      title: p.title,
      missingTitle: !p.seoTitle,
      missingDescription: !p.seoDescription,
    })),
    ...posts.map((p) => ({
      id: p.id,
      resource: "post" as const,
      title: p.title,
      missingTitle: !p.seoTitle,
      missingDescription: !p.seoDescription,
    })),
  ];
}

export async function aiFillSeoMeta(
  tenantId: string,
  item: { id: string; resource: "page" | "post" }
): Promise<SeoActionState & { seoTitle?: string; seoDescription?: string }> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });

    if (item.resource === "page") {
      const page = await prisma.page.findUnique({
        where: { id: item.id },
        select: { title: true, summary: true, seoTitle: true, seoDescription: true },
      });
      if (!page) return { error: "Không tìm thấy page" };

      const meta = await generateSeoMeta({ title: page.title, content: page.summary ?? "", siteName: tenant?.name });
      await prisma.page.update({
        where: { id: item.id },
        data: {
          seoTitle: page.seoTitle || meta.seoTitle,
          seoDescription: page.seoDescription || meta.seoDescription,
        },
      });
      revalidatePath(`/admin/sites/${tenantId}/seo`);
      return { ok: true, ...meta };
    }

    const post = await prisma.post.findUnique({
      where: { id: item.id },
      select: { title: true, content: true, excerpt: true, seoTitle: true, seoDescription: true },
    });
    if (!post) return { error: "Không tìm thấy bài viết" };

    const meta = await generateSeoMeta({
      title: post.title,
      content: post.excerpt || post.content,
      siteName: tenant?.name,
    });
    await prisma.post.update({
      where: { id: item.id },
      data: {
        seoTitle: post.seoTitle || meta.seoTitle,
        seoDescription: post.seoDescription || meta.seoDescription,
      },
    });
    revalidatePath(`/admin/sites/${tenantId}/seo`);
    return { ok: true, ...meta };
  } catch (err) {
    console.error("aiFillSeoMeta:", err);
    return { error: err instanceof Error ? err.message : "Lỗi AI generate" };
  }
}

// ===== Redirect Manager (Integration provider "redirects") =====

export type RedirectRule = { from: string; to: string; type: "301" | "302" };

export async function getRedirects(tenantId: string): Promise<RedirectRule[]> {
  await requireTenantAccess(tenantId, "EDITOR");
  const integration = await prisma.integration.findFirst({
    where: { tenantId, provider: "redirects" },
    select: { config: true },
  });
  const rules = (integration?.config as { rules?: RedirectRule[] } | null)?.rules;
  return Array.isArray(rules) ? rules : [];
}

async function saveRedirects(tenantId: string, rules: RedirectRule[]): Promise<void> {
  const existing = await prisma.integration.findFirst({
    where: { tenantId, provider: "redirects" },
    select: { id: true },
  });
  if (existing) {
    await prisma.integration.update({
      where: { id: existing.id },
      data: { status: "CONNECTED", config: { rules } },
    });
  } else {
    await prisma.integration.create({
      data: { tenantId, provider: "redirects", status: "CONNECTED", config: { rules } },
    });
  }
}

function normalizePath(p: string): string {
  const trimmed = p.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export async function addRedirectAction(
  tenantId: string,
  rule: { from: string; to: string; type: "301" | "302" }
): Promise<SeoActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    const from = normalizePath(rule.from);
    const to = normalizePath(rule.to);
    if (!from || !to || from === to) return { error: "Đường dẫn không hợp lệ" };
    if (/^https?:\/\//i.test(from)) return { error: "Đường dẫn nguồn phải là path nội bộ (vd: /trang-cu)" };

    const rules = await getRedirects(tenantId);
    if (rules.some((r) => r.from === from)) return { error: "Đã có redirect cho đường dẫn này" };

    await saveRedirects(tenantId, [...rules, { from, to, type: rule.type }]);
    revalidatePath(`/admin/sites/${tenantId}/seo`);
    return { ok: true };
  } catch (err) {
    console.error("addRedirectAction:", err);
    return { error: "Lỗi khi thêm redirect" };
  }
}

export async function deleteRedirectAction(tenantId: string, from: string): Promise<SeoActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    const rules = await getRedirects(tenantId);
    await saveRedirects(tenantId, rules.filter((r) => r.from !== from));
    revalidatePath(`/admin/sites/${tenantId}/seo`);
    return { ok: true };
  } catch (err) {
    console.error("deleteRedirectAction:", err);
    return { error: "Lỗi khi xóa redirect" };
  }
}

// ===== robots.txt editor (Integration provider "robots_txt") =====

export async function getRobotsContent(tenantId: string): Promise<string> {
  await requireTenantAccess(tenantId, "EDITOR");
  const integration = await prisma.integration.findFirst({
    where: { tenantId, provider: "robots_txt" },
    select: { config: true },
  });
  return (integration?.config as { content?: string } | null)?.content ?? "";
}

export async function saveRobotsAction(tenantId: string, content: string): Promise<SeoActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    if (content.length > 10_000) return { error: "Nội dung quá dài" };

    const existing = await prisma.integration.findFirst({
      where: { tenantId, provider: "robots_txt" },
      select: { id: true },
    });
    if (existing) {
      await prisma.integration.update({
        where: { id: existing.id },
        data: { status: "CONNECTED", config: { content } },
      });
    } else {
      await prisma.integration.create({
        data: { tenantId, provider: "robots_txt", status: "CONNECTED", config: { content } },
      });
    }
    revalidatePath(`/admin/sites/${tenantId}/seo`);
    return { ok: true };
  } catch (err) {
    console.error("saveRobotsAction:", err);
    return { error: "Lỗi khi lưu robots.txt" };
  }
}
