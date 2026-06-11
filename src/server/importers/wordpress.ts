import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";

export interface WordPressImportResult {
  ok: boolean;
  imported: number;
  skipped: number;
  notes: string[];
  errors: string[];
}

interface WpPost {
  id: number;
  slug: string;
  status: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  categories: number[];
  yoast_head_json?: { title?: string; description?: string };
}

interface WpPage {
  id: number;
  slug: string;
  status: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  yoast_head_json?: { title?: string; description?: string };
}

interface WpCategory {
  id: number;
  slug: string;
  name: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

async function wpFetch<T>(url: string): Promise<T[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "30Nice-Growth-OS/1.0" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`WP API ${res.status}: ${url}`);
  return res.json() as Promise<T[]>;
}

export async function importPagesFromWordPress(
  tenantId: string,
  wpBaseUrl?: string
): Promise<WordPressImportResult> {
  const base = (wpBaseUrl ?? "").replace(/\/$/, "");
  if (!base) return { ok: false, imported: 0, skipped: 0, notes: [], errors: ["Chưa cung cấp WordPress URL"] };

  const result: WordPressImportResult = { ok: true, imported: 0, skipped: 0, notes: [], errors: [] };

  try {
    const wpPages = await wpFetch<WpPage>(`${base}/wp-json/wp/v2/pages?per_page=100&status=publish`);

    for (const wp of wpPages) {
      try {
        const seoTitle = wp.yoast_head_json?.title ?? null;
        const seoDescription = wp.yoast_head_json?.description ?? null;
        const summary = stripHtml(wp.excerpt.rendered).slice(0, 500) || null;

        await prisma.page.upsert({
          where: { tenantId_slug: { tenantId, slug: wp.slug } },
          update: {
            title: wp.title.rendered,
            summary,
            seoTitle,
            seoDescription,
            uiBlocks: [{ type: "rich-text", html: wp.content.rendered }],
          },
          create: {
            tenantId,
            title: wp.title.rendered,
            slug: wp.slug,
            status: "PUBLISHED",
            summary,
            seoTitle,
            seoDescription,
            uiBlocks: [{ type: "rich-text", html: wp.content.rendered }],
          },
        });
        result.imported++;
      } catch {
        result.skipped++;
        result.errors.push(`Bỏ qua trang: ${wp.slug}`);
      }
    }
  } catch (e) {
    result.ok = false;
    result.errors.push(e instanceof Error ? e.message : "Lỗi kết nối WordPress");
  }

  return result;
}

export async function importPostsFromWordPress(
  tenantId: string,
  wpBaseUrl?: string
): Promise<WordPressImportResult> {
  const base = (wpBaseUrl ?? "").replace(/\/$/, "");
  if (!base) return { ok: false, imported: 0, skipped: 0, notes: [], errors: ["Chưa cung cấp WordPress URL"] };

  const result: WordPressImportResult = { ok: true, imported: 0, skipped: 0, notes: [], errors: [] };

  try {
    // 1. Import categories
    const wpCategories = await wpFetch<WpCategory>(`${base}/wp-json/wp/v2/categories?per_page=100`);
    const catIdMap: Record<number, string> = {};

    for (const cat of wpCategories) {
      if (cat.slug === "uncategorized") continue;
      const record = await prisma.category.upsert({
        where: { tenantId_slug: { tenantId, slug: cat.slug } },
        update: { name: cat.name },
        create: { tenantId, name: cat.name, slug: cat.slug },
      });
      catIdMap[cat.id] = record.id;
    }

    // 2. Import posts
    const wpPosts = await wpFetch<WpPost>(`${base}/wp-json/wp/v2/posts?per_page=100&status=publish`);

    for (const wp of wpPosts) {
      try {
        const categoryId = wp.categories?.[0] ? catIdMap[wp.categories[0]] ?? null : null;
        const seoTitle = wp.yoast_head_json?.title ?? null;
        const seoDescription = wp.yoast_head_json?.description ?? null;
        const excerpt = stripHtml(wp.excerpt.rendered).slice(0, 500) || null;

        await prisma.post.upsert({
          where: { tenantId_slug: { tenantId, slug: wp.slug } },
          update: {
            title: wp.title.rendered,
            excerpt,
            content: wp.content.rendered,
            seoTitle,
            seoDescription,
            categoryId,
          },
          create: {
            tenantId,
            title: wp.title.rendered,
            slug: wp.slug,
            excerpt,
            content: wp.content.rendered,
            status: "PUBLISHED",
            publishedAt: new Date(wp.date),
            seoTitle,
            seoDescription,
            categoryId,
          },
        });
        result.imported++;
      } catch {
        result.skipped++;
        result.errors.push(`Bỏ qua bài: ${wp.slug}`);
      }
    }
  } catch (e) {
    result.ok = false;
    result.errors.push(e instanceof Error ? e.message : "Lỗi kết nối WordPress");
  }

  return result;
}

export async function importSitesFromWordPress(
  _options?: { wpBaseUrl?: string; orgId?: string }
): Promise<WordPressImportResult> {
  return {
    ok: false,
    imported: 0,
    skipped: 0,
    notes: ["Dùng API tạo site thủ công hoặc nhập pages/posts theo từng tenant."],
    errors: [],
  };
}

export async function importMediaFromWordPress(
  _tenantId: string,
  _wpBaseUrl?: string
): Promise<WordPressImportResult> {
  return {
    ok: false,
    imported: 0,
    skipped: 0,
    notes: ["Nhập media sẽ được hỗ trợ trong phiên bản tiếp theo."],
    errors: [],
  };
}

export type WpPageCreateInput = Prisma.PageCreateInput;
export type WpPostCreateInput = Prisma.PostCreateInput;
