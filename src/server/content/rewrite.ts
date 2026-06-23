import { aiGenerate } from "@/server/ai/generate";

export type RewriteDraft = {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  schemaData: string;
};

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || `travel-guide-${Date.now()}`;
}

function safeJson(text: string) {
  const cleaned = text.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

function fallbackDraft(input: { sourceTitle?: string | null; sourceText: string; targetKeyword?: string | null; siteName?: string | null }): RewriteDraft {
  const keyword = input.targetKeyword || input.sourceTitle || "Vietnam travel guide";
  const title = `${keyword.replace(/\b\w/g, (c) => c.toUpperCase())}: Complete Travel Guide`;
  const paragraphs = input.sourceText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).slice(0, 6);
  const body = paragraphs.map((p) => `<p>${p.replace(/[<>]/g, "")}</p>`).join("\n");
  const contentHtml = `<h1>${title}</h1>\n<p>This English travel guide is rewritten and structured for international visitors.</p>\n<h2>Overview</h2>\n${body}\n<h2>Travel Tips</h2>\n<ul><li>Plan transport and timing before you go.</li><li>Compare tours, hotels, and seasonal conditions.</li><li>Save key addresses and local contact information.</li></ul>\n<h2>FAQ</h2>\n<h3>Is ${keyword} worth visiting?</h3><p>Yes, it can be a strong destination for travelers who want culture, scenery, food, and practical experiences.</p>`;
  return { title, slug: slugify(title), excerpt: `${title} with practical tips, itinerary ideas, and helpful planning advice for foreign visitors.`.slice(0, 220), contentHtml, seoTitle: title.slice(0, 70), seoDescription: `Read this ${keyword} guide for travel tips, itinerary ideas, things to do, and planning advice for foreign visitors.`.slice(0, 155), schemaData: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, inLanguage: "en" }) };
}

const SYSTEM = `You are an expert English SEO travel editor. Rewrite source material into a new, original, helpful article for foreign visitors. Do not copy sentence structure. Add practical sections where useful: overview, best time to visit, how to get there, things to do, itinerary, tips, FAQ. Return ONLY valid JSON with keys: title, slug, excerpt, contentHtml, seoTitle, seoDescription, schemaData. contentHtml must use HTML tags only: h1,h2,h3,p,ul,li,strong. schemaData must be a JSON string for Article schema.`;

export async function rewriteSourceArticle(input: { sourceTitle?: string | null; sourceText: string; targetKeyword?: string | null; siteName?: string | null; canonicalUrl?: string | null; }): Promise<RewriteDraft> {
  try {
    const prompt = `Target keyword: ${input.targetKeyword || input.sourceTitle || "travel guide"}\nSite: ${input.siteName || "Travel news site"}\nSource title: ${input.sourceTitle || "Untitled"}\nSource canonical: ${input.canonicalUrl || ""}\n\nSource text excerpt:\n${input.sourceText.slice(0, 9000)}\n\nCreate a new original English SEO draft. JSON only.`;
    const { text } = await aiGenerate(SYSTEM, prompt);
    const parsed = JSON.parse(safeJson(text)) as Partial<RewriteDraft>;
    if (!parsed.title || !parsed.contentHtml) throw new Error("AI returned incomplete draft");
    const title = parsed.title.trim();
    return {
      title,
      slug: slugify(parsed.slug || title),
      excerpt: (parsed.excerpt || "").slice(0, 500),
      contentHtml: parsed.contentHtml,
      seoTitle: (parsed.seoTitle || title).slice(0, 200),
      seoDescription: (parsed.seoDescription || "").slice(0, 500),
      schemaData: parsed.schemaData || JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, inLanguage: "en" }),
    };
  } catch {
    return fallbackDraft(input);
  }
}
