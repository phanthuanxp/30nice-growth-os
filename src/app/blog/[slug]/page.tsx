import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { resolveTenant } from "@/server/tenant/resolve";
import { getPostBySlug, getPublishedPostsByTenant } from "@/server/queries/posts";
import { prisma } from "@/server/db";
import { ThemeChrome } from "@/components/themes/theme-chrome";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await resolveTenant();
  const host = (await headers()).get("host")?.replace(/^www\./, "") ?? "";

  let post = null;
  try {
    post = await getPostBySlug(tenant.id, slug);
  } catch {
    return {};
  }
  if (!post || post.status !== "PUBLISHED") return {};

  const url = post.canonicalUrl || `https://${host}/blog/${post.slug}`;
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: post.robotsMeta || undefined,
    openGraph: {
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.ogImage || post.featuredImage ? [{ url: (post.ogImage || post.featuredImage)! }] : undefined,
    },
    twitter: {
      card: (post.twitterCard as "summary" | "summary_large_image" | null) || "summary_large_image",
      title: post.ogTitle || title,
      description: post.ogDescription || description,
    },
  };
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await resolveTenant();
  const host = (await headers()).get("host")?.replace(/^www\./, "") ?? "";

  let post = null;
  let settings = null;
  try {
    [post, settings] = await Promise.all([
      getPostBySlug(tenant.id, slug),
      prisma.siteSettings.findUnique({ where: { tenantId: tenant.id } }),
    ]);
  } catch {
    notFound();
  }

  if (!post || post.status !== "PUBLISHED") notFound();

  // Related posts: same category first, fallback to latest
  let related: Awaited<ReturnType<typeof getPublishedPostsByTenant>> = [];
  try {
    const all = await getPublishedPostsByTenant(tenant.id);
    const sameCategory = all.filter((p) => p.id !== post.id && p.categoryId && p.categoryId === post.categoryId);
    const others = all.filter((p) => p.id !== post.id && (!post.categoryId || p.categoryId !== post.categoryId));
    related = [...sameCategory, ...others].slice(0, 3);
  } catch {
    related = [];
  }

  // JSON-LD Article — custom schemaData takes priority if valid
  let jsonLd: object = {
    "@context": "https://schema.org",
    "@type": post.schemaType || "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: tenant.name },
    publisher: { "@type": "Organization", name: tenant.name },
    mainEntityOfPage: `https://${host}/blog/${post.slug}`,
  };
  if (post.schemaData) {
    try {
      jsonLd = JSON.parse(post.schemaData);
    } catch {
      // keep auto-generated
    }
  }

  const article = (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-400">
        <Link href="/" className="hover:text-blue-700">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-blue-700">Blog</Link>
        {post.category && (
          <>
            <span className="mx-2">/</span>
            <span className="text-slate-500">{post.category.name}</span>
          </>
        )}
      </nav>

      <article>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.category && (
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                {post.category.name}
              </span>
            )}
            {post.publishedAt && (
              <time dateTime={post.publishedAt.toISOString()} className="text-xs text-slate-400">
                {formatDate(post.publishedAt)}
              </time>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="text-lg text-slate-500 mt-4 pb-6 border-b border-slate-100">{post.excerpt}</p>
          )}
        </header>

        {post.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full rounded-2xl mb-8 object-cover max-h-[480px]"
          />
        )}

        <div
          className="re-visual prose-content text-slate-700 leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_a]:text-blue-700 [&_a]:underline [&_img]:rounded-xl [&_img]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {related.length > 0 && (
        <aside className="mt-14 pt-10 border-t border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Bài viết liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                  {p.title}
                </h3>
                {p.publishedAt && (
                  <p className="text-xs text-slate-400 mt-2">{formatDate(p.publishedAt)}</p>
                )}
              </Link>
            ))}
          </div>
        </aside>
      )}
    </div>
  );

  if (settings?.theme && settings.theme !== "default") {
    return (
      <ThemeChrome tenantId={tenant.id} tenantName={tenant.name} settings={settings}>
        {article}
      </ThemeChrome>
    );
  }

  return <div className="min-h-screen bg-white">{article}</div>;
}
