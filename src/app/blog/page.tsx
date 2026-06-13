import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { resolveTenant } from "@/server/tenant/resolve";
import { getPublishedPostsByTenant } from "@/server/queries/posts";
import { prisma } from "@/server/db";
import { ThemeChrome } from "@/components/themes/theme-chrome";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenant();
  const host = (await headers()).get("host")?.replace(/^www\./, "") ?? "";
  const title = `Blog — ${tenant.name}`;
  return {
    title,
    description: `Tin tức, kinh nghiệm và cẩm nang từ ${tenant.name}.`,
    alternates: { canonical: `https://${host}/blog` },
    openGraph: {
      title,
      description: `Tin tức, kinh nghiệm và cẩm nang từ ${tenant.name}.`,
      url: `https://${host}/blog`,
      type: "website",
    },
  };
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export default async function BlogListPage() {
  const tenant = await resolveTenant();

  let posts: Awaited<ReturnType<typeof getPublishedPostsByTenant>> = [];
  let settings = null;
  try {
    [posts, settings] = await Promise.all([
      getPublishedPostsByTenant(tenant.id),
      prisma.siteSettings.findUnique({ where: { tenantId: tenant.id } }),
    ]);
  } catch {
    // DB unavailable — render empty list
  }

  const content = (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Blog &amp; Tin tức</h1>
        <p className="text-slate-500 mt-2">Kinh nghiệm, cẩm nang và cập nhật mới nhất từ {tenant.name}</p>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">Chưa có bài viết nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <Link href={`/blog/${post.slug}`} className="block aspect-[16/10] bg-slate-100 overflow-hidden">
                {post.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <span className="text-4xl">📰</span>
                  </div>
                )}
              </Link>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2 text-xs">
                  {post.category && (
                    <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {post.category.name}
                    </span>
                  )}
                  {post.publishedAt && <time className="text-slate-400">{formatDate(post.publishedAt)}</time>}
                </div>
                <h2 className="text-base font-semibold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3 flex-1">{post.excerpt}</p>
                )}
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-medium text-blue-700 mt-4 inline-flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Đọc tiếp →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  if (settings?.theme && settings.theme !== "default") {
    return (
      <ThemeChrome tenantId={tenant.id} tenantName={tenant.name} settings={settings}>
        <div className="bg-slate-50">{content}</div>
      </ThemeChrome>
    );
  }

  return <div className="min-h-screen bg-slate-50">{content}</div>;
}
