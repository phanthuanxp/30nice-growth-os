import Link from "next/link";
import { Calendar, ChevronRight, Tag } from "lucide-react";
import { TravelNewsHeader } from "./travel-news-header";
import { TravelNewsFooter } from "./travel-news-footer";
import { DEFAULT_TRAVEL_NEWS_CONFIG, type TravelNewsThemeConfig } from "./types";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  category?: { name: string } | null;
}

interface PageBlock {
  type: string;
  content?: string;
  heading?: string;
  items?: { text: string }[];
  src?: string;
  alt?: string;
  caption?: string;
}

interface Page {
  title: string;
  slug: string;
  blocks?: PageBlock[];
  content?: string;
  featuredImage?: string | null;
  excerpt?: string | null;
}

interface Props {
  siteName: string;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
  themeConfig?: Partial<TravelNewsThemeConfig> | null;
  page?: Page | null;
  recentPosts?: Post[];
  navItems?: { label: string; href: string }[];
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`group block rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-200 ${featured ? "md:col-span-2 md:row-span-2" : ""}`}>
      <div className={`relative bg-slate-100 overflow-hidden ${featured ? "h-72" : "h-44"}`}>
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <span className="text-white text-4xl opacity-40">✈</span>
          </div>
        )}
        {post.category && (
          <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {post.category.name}
          </span>
        )}
      </div>
      <div className={`p-4 ${featured ? "p-6" : ""}`}>
        <h3 className={`font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2 ${featured ? "text-xl mb-2" : "text-base mb-1"}`}>
          {post.title}
        </h3>
        {featured && post.excerpt && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.publishedAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TravelNewsPage({ siteName, logoUrl, email, address, themeConfig, page, recentPosts = [], navItems }: Props) {
  const config: TravelNewsThemeConfig = {
    ...DEFAULT_TRAVEL_NEWS_CONFIG,
    ...themeConfig,
    ...(navItems ? { navItems } : {}),
  };

  const featuredPost = recentPosts[0];
  const gridPosts = recentPosts.slice(1, 7);

  return (
    <div className="min-h-screen bg-slate-50">
      <TravelNewsHeader config={config} siteName={siteName} logoUrl={logoUrl} />

      <main className="pt-[88px]">
        {/* Hero banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white py-10 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-2">Travel News</p>
            <h1 className="text-2xl sm:text-3xl font-bold">{config.heroTagline}</h1>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {/* If this is a CMS page, render its blocks */}
          {page && (page.blocks || page.content) ? (
            <div className="max-w-3xl mx-auto">
              <article className="bg-white rounded-2xl border border-slate-200 p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">{page.title}</h1>
                {page.content ? (
                  <div
                    className="prose prose-slate max-w-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_a]:text-emerald-700 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                ) : (
                  <div className="space-y-4">
                    {(page.blocks || []).map((block, i) => {
                      if (block.type === "paragraph" && block.content)
                        return <p key={i} className="text-slate-700 leading-relaxed">{block.content}</p>;
                      if (block.type === "heading" && block.heading)
                        return <h2 key={i} className="text-xl font-bold text-slate-900 mt-6">{block.heading}</h2>;
                      if (block.type === "image" && block.src)
                        return <img key={i} src={block.src} alt={block.alt || ""} className="w-full rounded-xl my-4" />;
                      return null;
                    })}
                  </div>
                )}
              </article>
            </div>
          ) : (
            /* Blog listing layout */
            <div>
              {/* Featured + grid */}
              {recentPosts.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-emerald-600" />
                      Tin mới nhất
                    </h2>
                    <Link href="/blog" className="text-sm text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                      Xem tất cả <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {featuredPost && <PostCard post={featuredPost} featured />}
                    {gridPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-slate-400">
                  <span className="text-5xl block mb-4">✈</span>
                  <p className="font-medium text-lg">Sắp có nội dung mới</p>
                  <p className="text-sm mt-1">Hãy quay lại sau để đọc tin du lịch mới nhất.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <TravelNewsFooter config={config} siteName={siteName} logoUrl={logoUrl} email={email} address={address} />
    </div>
  );
}
