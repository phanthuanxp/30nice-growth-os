import type { Metadata } from "next";
import Link from "next/link";
import { resolveTenant } from "@/server/tenant/resolve";
import { posts } from "@/server/queries/demo-data";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogListPage() {
  const tenant = await resolveTenant();
  const tenantPosts = posts.filter(
    (p) => p.tenantId === tenant.id && p.status === "PUBLISHED"
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Blog</h1>
      <p className="text-slate-500 mb-10">{tenant.name}</p>

      {tenantPosts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">Chưa có bài viết nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tenantPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
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
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold text-slate-800 hover:text-indigo-600 transition-colors mb-2">
                  {post.title}
                </h2>
              </Link>
              <p className="text-slate-500 text-sm">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
              >
                Đọc tiếp →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
