import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { resolveTenant } from "@/server/tenant/resolve";
import { posts } from "@/server/queries/demo-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await resolveTenant();
  const post = posts.find((p) => p.tenantId === tenant.id && p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await resolveTenant();
  const post = posts.find(
    (p) => p.tenantId === tenant.id && p.slug === slug && p.status === "PUBLISHED"
  );

  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/blog"
        className="text-sm text-indigo-600 hover:underline mb-8 inline-block"
      >
        ← Quay lại Blog
      </Link>

      <article>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
            Blog
          </span>
          {post.publishedAt && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">{post.publishedAt}</span>
            </>
          )}
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">{post.title}</h1>

        {post.excerpt && (
          <p className="text-lg text-slate-500 mb-8 pb-8 border-b border-slate-100">
            {post.excerpt}
          </p>
        )}

        {/* Demo content — real content comes from DB */}
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 leading-relaxed">
            Đây là nội dung demo của bài viết. Nội dung thật sẽ được lưu trong database và
            hiển thị ở đây sau khi kết nối Prisma với PostgreSQL.
          </p>
          <p className="text-slate-600 leading-relaxed mt-4">
            30Nice Growth OS hỗ trợ rich-text content với đầy đủ định dạng: heading, bullet
            list, link, image, video embed và nhiều hơn nữa.
          </p>
        </div>
      </article>

      <div className="mt-12 pt-8 border-t border-slate-100">
        <p className="text-sm text-slate-400">
          Site: <strong>{tenant.name}</strong> · Slug:{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
            {slug}
          </code>
        </p>
      </div>
    </div>
  );
}
