export interface SubdomainSuggestion {
  keyword: string;
  subdomain: string;
  domain: string;
  score: number;
  intent: string;
  rationale: string;
  contentPlan: string[];
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "to", "for", "with", "by", "from",
  "best", "top", "guide", "review", "reviews", "things", "do", "visit", "travel", "tour",
]);

export function normalizeRootDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").replace(/[^a-z0-9.-]/g, "").replace(/^\.+|\.+$/g, "");
}

export function keywordToSubdomainSlug(keyword: string) {
  const cleaned = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean).filter((part) => !STOP_WORDS.has(part));
  const preferred = cleaned.length > 0 ? cleaned : keyword.toLowerCase().split(/\s+/);
  return preferred.join("").replace(/[^a-z0-9-]/g, "").slice(0, 40);
}

function detectIntent(keyword: string) {
  const k = keyword.toLowerCase();
  if (/hotel|resort|stay|accommodation/.test(k)) return "Hotel / accommodation review";
  if (/cruise|tour|ticket|package/.test(k)) return "Tour / experience review";
  if (/airport|transfer|bus|train|taxi|transport/.test(k)) return "Transport guide";
  if (/itinerary|days|day trip|route/.test(k)) return "Itinerary planning";
  if (/food|restaurant|cafe|nightlife/.test(k)) return "Local experience guide";
  return "Destination travel guide";
}

function scoreKeyword(keyword: string, slug: string) {
  let score = 58;
  const words = keyword.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 2 && words <= 5) score += 14;
  if (slug.length >= 6 && slug.length <= 18) score += 12;
  if (/bay|island|beach|city|old town|airport|hotel|cruise|travel|guide|things to do|itinerary/i.test(keyword)) score += 10;
  if (slug.length > 24) score -= 8;
  return Math.max(35, Math.min(96, score));
}

function buildContentPlan(keyword: string, intent: string) {
  const title = keyword.replace(/\s+/g, " ").trim();
  return [
    `${title}: Complete Travel Guide`,
    `Best Time to Visit ${title}`,
    `How to Get to ${title}`,
    `Best Things to Do in ${title}`,
    `${title} Itinerary and Travel Tips`,
    `${title} FAQ for First-Time Visitors`,
    intent.includes("Hotel") ? `Best Hotels and Areas to Stay in ${title}` : `Best Tours and Experiences Around ${title}`,
  ];
}

export function generateSubdomainSuggestions(input: { rootDomain: string; keywords: string; topics?: string }) {
  const rootDomain = normalizeRootDomain(input.rootDomain || "example.com");
  const rawItems = `${input.keywords}\n${input.topics ?? ""}`.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
  const seen = new Set<string>();
  return rawItems.flatMap((keyword) => {
    const subdomain = keywordToSubdomainSlug(keyword);
    if (!subdomain || seen.has(subdomain)) return [];
    seen.add(subdomain);
    const intent = detectIntent(keyword);
    const score = scoreKeyword(keyword, subdomain);
    return [{ keyword, subdomain, domain: `${subdomain}.${rootDomain}`, score, intent, rationale: `Strong topical silo for ${intent.toLowerCase()}; suitable as a focused English travel/news subdomain.`, contentPlan: buildContentPlan(keyword, intent) } satisfies SubdomainSuggestion];
  }).sort((a, b) => b.score - a.score);
}
