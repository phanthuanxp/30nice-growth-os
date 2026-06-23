export type QualityIssue = { type: "error" | "warning" | "tip"; message: string };
export type QualityReport = {
  qualityScore: number;
  seoScore: number;
  wordCount: number;
  headingCount: number;
  hasFaq: boolean;
  hasSchema: boolean;
  issues: QualityIssue[];
};

function stripHtml(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function words(text: string) { return text.split(/\s+/).filter(Boolean); }
function keywordCoverage(text: string, keyword?: string | null) {
  if (!keyword) return 50;
  const hay = text.toLowerCase();
  const parts = keyword.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (parts.length === 0) return 50;
  const hits = parts.filter((p) => hay.includes(p)).length;
  return Math.round((hits / parts.length) * 100);
}

export function scorePostDraft(input: { title: string; content: string; excerpt?: string | null; seoTitle?: string | null; seoDescription?: string | null; schemaData?: string | null; keyword?: string | null; }) : QualityReport {
  const text = stripHtml(input.content);
  const wordCount = words(text).length;
  const headingCount = (input.content.match(/<h[1-3][^>]*>/gi) || []).length;
  const hasFaq = /faq|frequently asked|<h2[^>]*>\s*faq/i.test(input.content);
  const hasSchema = Boolean(input.schemaData && input.schemaData.includes("schema.org"));
  const issues: QualityIssue[] = [];
  let quality = 100;
  let seo = 100;

  if (wordCount < 600) { quality -= 25; seo -= 10; issues.push({ type: "warning", message: `Thin content risk: ${wordCount} words. Aim for 900+ words for travel guides.` }); }
  else if (wordCount < 900) { quality -= 10; issues.push({ type: "tip", message: `Content is acceptable but could be deeper: ${wordCount} words.` }); }
  if (headingCount < 4) { quality -= 10; seo -= 15; issues.push({ type: "warning", message: "Add more H2/H3 sections for scanability and SEO structure." }); }
  if (!hasFaq) { quality -= 5; seo -= 8; issues.push({ type: "tip", message: "Add an FAQ section for long-tail travel queries." }); }
  if (!hasSchema) { seo -= 10; issues.push({ type: "warning", message: "Missing Article schema data." }); }
  const titleLen = input.title.length;
  if (titleLen < 25 || titleLen > 75) { seo -= 10; issues.push({ type: "warning", message: `Title length (${titleLen}) should usually be 25–75 characters.` }); }
  const seoTitleLen = (input.seoTitle || input.title).length;
  if (seoTitleLen > 70) { seo -= 8; issues.push({ type: "warning", message: `SEO title is long (${seoTitleLen}); keep around 50–70 characters.` }); }
  const descLen = (input.seoDescription || input.excerpt || "").length;
  if (descLen < 90 || descLen > 170) { seo -= 12; issues.push({ type: "warning", message: `Meta description length (${descLen}) should be about 90–170 characters.` }); }
  const coverage = keywordCoverage(`${input.title} ${text}`, input.keyword);
  if (input.keyword && coverage < 60) { seo -= 15; issues.push({ type: "warning", message: `Keyword coverage is low for "${input.keyword}".` }); }
  if (!/<ul|<ol/i.test(input.content)) { quality -= 4; issues.push({ type: "tip", message: "Add bullet lists for useful travel tips or itinerary steps." }); }
  if (!/how to|get there|transport|airport|bus|train|taxi/i.test(text)) { quality -= 4; issues.push({ type: "tip", message: "Consider adding transport/how-to-get-there details." }); }

  return { qualityScore: Math.max(0, Math.min(100, quality)), seoScore: Math.max(0, Math.min(100, seo)), wordCount, headingCount, hasFaq, hasSchema, issues };
}
