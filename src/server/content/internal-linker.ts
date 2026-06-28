import { prisma } from "@/server/db";

interface RelatedPost {
  title: string;
  slug: string;
  score: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function scoreRelevance(candidateTitle: string, keyword: string, articleTitle: string): number {
  const kw = tokenize(keyword);
  const art = tokenize(articleTitle);
  const cand = tokenize(candidateTitle);
  const ref = new Set([...kw, ...art]);
  return cand.filter((w) => ref.has(w)).length;
}

export async function fetchRelatedPosts(
  tenantId: string,
  keyword: string | null | undefined,
  excludeSlug: string,
  limit = 3
): Promise<RelatedPost[]> {
  const posts = await prisma.post.findMany({
    where: { tenantId, status: "PUBLISHED", slug: { not: excludeSlug } },
    select: { title: true, slug: true },
    orderBy: { publishedAt: "desc" },
    take: 60,
  });

  const kw = keyword || excludeSlug.replace(/-/g, " ");
  const scored: RelatedPost[] = posts
    .map((p) => ({ title: p.title, slug: p.slug, score: scoreRelevance(p.title, kw, kw) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // If no keyword matches found, just take the most recent posts
  if (scored.length === 0) {
    return posts.slice(0, limit).map((p) => ({ title: p.title, slug: p.slug, score: 0 }));
  }

  return scored;
}

export function injectInternalLinks(html: string, relatedPosts: RelatedPost[]): string {
  if (relatedPosts.length === 0) return html;

  // Split HTML at </p> boundaries to find injection points
  const parts = html.split(/((?:<\/(?:p|li|blockquote)>))/i);

  if (parts.length < 6) {
    // Short article: just append a "See also" section at the end
    const seeAlso = buildSeeAlsoSection(relatedPosts);
    return html + seeAlso;
  }

  // Find </p> tag indices in the parts array
  const closingTags: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (/^<\/(?:p|li|blockquote)>$/i.test(parts[i])) closingTags.push(i);
  }

  // Inject after the 2nd, middle, and near-last paragraph
  const targets = new Set<number>();
  if (closingTags.length >= 2) targets.add(closingTags[Math.min(1, closingTags.length - 1)]);
  if (closingTags.length >= 5) targets.add(closingTags[Math.floor(closingTags.length * 0.5)]);
  if (closingTags.length >= 8) targets.add(closingTags[Math.floor(closingTags.length * 0.8)]);

  let postIndex = 0;
  const result = parts.map((part, i) => {
    if (targets.has(i) && postIndex < relatedPosts.length) {
      const post = relatedPosts[postIndex++];
      return part + buildInlineLink(post);
    }
    return part;
  });

  return result.join("");
}

function buildInlineLink(post: RelatedPost): string {
  return `\n<p class="internal-link-callout" style="border-left:3px solid #6366f1;padding:8px 12px;margin:12px 0;background:#f5f3ff;border-radius:0 6px 6px 0;font-size:0.9em;color:#4338ca;">→ Xem thêm: <a href="/blog/${post.slug}" style="color:#4338ca;font-weight:600;text-decoration:underline;">${post.title}</a></p>`;
}

function buildSeeAlsoSection(posts: RelatedPost[]): string {
  const links = posts
    .map((p) => `<li><a href="/blog/${p.slug}">${p.title}</a></li>`)
    .join("\n");
  return `\n<h2>Xem thêm</h2>\n<ul>\n${links}\n</ul>`;
}
