import { aiGenerate } from "@/server/ai/generate";

export type PlanDraft = {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  schemaData: string;
};

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || `travel-article-${Date.now()}`;
}

function stripFence(text: string) {
  const cleaned = text.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
}

function fallbackPlanDraft(input: { title: string; keyword: string; intent?: string | null; siteName?: string | null; planTitle?: string | null }): PlanDraft {
  const title = input.title || `${input.keyword}: Complete Travel Guide`;
  const keyword = input.keyword || title;
  const contentHtml = `<h1>${title}</h1>
<p>This English travel article is prepared for foreign visitors researching ${keyword}. It is structured as a helpful SEO draft and should be reviewed before publishing.</p>
<h2>Overview</h2>
<p>${keyword} is a useful topic for travelers who want practical, trustworthy information before planning a trip. This guide explains what to expect, how to plan, and which details matter most.</p>
<h2>Best Things to Know</h2>
<ul><li>Check the best time to visit and local travel conditions.</li><li>Compare transport, hotels, tours, and nearby attractions.</li><li>Plan enough time for the main experience and flexible alternatives.</li></ul>
<h2>Suggested Itinerary</h2>
<p>Start with the main attraction or destination, then add nearby food, culture, viewpoints, and convenient transport options. Keep the schedule realistic for first-time international visitors.</p>
<h2>Travel Tips</h2>
<p>Bring local currency, confirm pickup points, check weather, and save important addresses offline. Travelers should compare recent reviews before booking tours or hotels.</p>
<h2>FAQ</h2>
<h3>Is ${keyword} worth it?</h3><p>Yes, it can be worth it when travelers plan around the right season, transport, and interests.</p>
<h3>How many days are enough?</h3><p>Most visitors should plan at least one full day, while deeper trips may need two or more days.</p>`;
  return { title, slug: slugify(title), excerpt: `A practical English guide to ${keyword}, including travel tips, itinerary ideas, and useful planning advice for foreign visitors.`, contentHtml, seoTitle: title.slice(0, 70), seoDescription: `Read this ${keyword} guide for practical travel tips, itinerary ideas, things to do, and planning advice for foreign visitors.`.slice(0, 155), schemaData: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, inLanguage: "en" }) };
}

const SYSTEM = `You are an expert English SEO travel editor for news/review/travel websites targeting foreign visitors.
Create a NEW original article draft from a content plan item, not from copied source text.
Return ONLY valid JSON with keys: title, slug, excerpt, contentHtml, seoTitle, seoDescription, schemaData.
contentHtml must use h1,h2,h3,p,ul,li,strong only. Include helpful sections: overview, best time/when relevant, how to get there/transport when relevant, things to do, tips, FAQ. Avoid lead/form/booking CRM language.`;

export async function generateDraftFromContentPlanItem(input: { title: string; keyword: string; intent?: string | null; articleType?: string | null; siteName?: string | null; planTitle?: string | null; }): Promise<PlanDraft> {
  try {
    const prompt = `Site: ${input.siteName || "Travel news site"}\nContent plan: ${input.planTitle || "Travel content plan"}\nArticle title: ${input.title}\nTarget keyword: ${input.keyword}\nIntent: ${input.intent || "travel guide"}\nArticle type: ${input.articleType || "travel_guide"}\n\nGenerate one complete original English SEO article draft. JSON only.`;
    const { text } = await aiGenerate(SYSTEM, prompt);
    const parsed = JSON.parse(stripFence(text)) as Partial<PlanDraft>;
    if (!parsed.title || !parsed.contentHtml) throw new Error("Incomplete AI draft");
    const title = parsed.title.trim();
    return { title, slug: slugify(parsed.slug || title), excerpt: (parsed.excerpt || "").slice(0, 500), contentHtml: parsed.contentHtml, seoTitle: (parsed.seoTitle || title).slice(0, 200), seoDescription: (parsed.seoDescription || "").slice(0, 500), schemaData: parsed.schemaData || JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, inLanguage: "en" }) };
  } catch {
    return fallbackPlanDraft(input);
  }
}
