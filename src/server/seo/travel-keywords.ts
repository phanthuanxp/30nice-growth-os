import { aiGenerate } from "@/server/ai/generate";

export type TravelKeywordSeed = {
  keyword: string;
  intent: "INFORMATIONAL" | "COMMERCIAL" | "TRANSACTIONAL" | "NAVIGATIONAL";
  category: string;
};

const DEFAULT_DESTINATIONS = ["Ha Long Bay", "Da Nang", "Hoi An", "Sapa", "Phu Quoc", "Hanoi", "Ninh Binh", "Ho Chi Minh City"];
const MODIFIERS = [
  { suffix: "travel guide", intent: "INFORMATIONAL", category: "destination" },
  { suffix: "things to do", intent: "INFORMATIONAL", category: "things-to-do" },
  { suffix: "itinerary", intent: "INFORMATIONAL", category: "itinerary" },
  { suffix: "best hotels", intent: "COMMERCIAL", category: "hotel-review" },
  { suffix: "where to stay", intent: "COMMERCIAL", category: "hotel-review" },
  { suffix: "best time to visit", intent: "INFORMATIONAL", category: "seasonal" },
  { suffix: "tour review", intent: "COMMERCIAL", category: "review" },
  { suffix: "airport transfer", intent: "TRANSACTIONAL", category: "transport" },
  { suffix: "food guide", intent: "INFORMATIONAL", category: "food" },
] as const;

const SYSTEM = `You are an SEO strategist for English travel/news/review websites targeting foreign visitors.
Generate keyword ideas for topical authority sites and subdomains.
Return ONLY a JSON array. Each item must be {"keyword":"...","intent":"INFORMATIONAL|COMMERCIAL|TRANSACTIONAL|NAVIGATIONAL","category":"destination|hotel-review|itinerary|transport|food|seasonal|review|comparison|news"}.
Focus on destinations, tourist attractions, hotels, reviews, itineraries, airport/transport, and travel guides. No lead/form/booking CRM terms.`;

function splitInput(value: string) {
  return value.split(/[\n,]+/).map((v) => v.trim()).filter(Boolean);
}

export function fallbackTravelKeywords(input: { niche?: string; destinations?: string; limit?: number }): TravelKeywordSeed[] {
  const destinations = splitInput(input.destinations || "");
  const bases = destinations.length > 0 ? destinations : DEFAULT_DESTINATIONS;
  const rows: TravelKeywordSeed[] = [];
  for (const dest of bases) {
    for (const mod of MODIFIERS) {
      rows.push({ keyword: `${dest} ${mod.suffix}`.toLowerCase(), intent: mod.intent, category: mod.category });
    }
    rows.push({ keyword: `${dest} vs other vietnam destinations`.toLowerCase(), intent: "COMMERCIAL", category: "comparison" });
  }
  if (input.niche) rows.push({ keyword: `${input.niche} in vietnam`.toLowerCase(), intent: "INFORMATIONAL", category: "destination" });
  return rows.slice(0, input.limit ?? 120);
}

export async function generateTravelKeywords(input: { niche?: string; destinations?: string; rootDomain?: string; limit?: number }): Promise<TravelKeywordSeed[]> {
  const limit = Math.min(Math.max(input.limit ?? 80, 10), 200);
  try {
    const prompt = `Niche: ${input.niche || "Vietnam travel news and reviews"}\nRoot domain: ${input.rootDomain || "not specified"}\nDestinations/entities:\n${input.destinations || DEFAULT_DESTINATIONS.join("\n")}\n\nGenerate ${limit} English SEO keywords.`;
    const { text } = await aiGenerate(SYSTEM, prompt);
    const json = text.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
    const parsed = JSON.parse(json) as Array<{ keyword?: string; intent?: string; category?: string }>;
    const validIntent = new Set(["INFORMATIONAL", "COMMERCIAL", "TRANSACTIONAL", "NAVIGATIONAL"]);
    const clean = parsed.flatMap((item) => {
      const keyword = item.keyword?.trim().toLowerCase();
      if (!keyword) return [];
      const intent = validIntent.has((item.intent || "").toUpperCase()) ? item.intent!.toUpperCase() : "INFORMATIONAL";
      return [{ keyword, intent: intent as TravelKeywordSeed["intent"], category: item.category || "destination" }];
    });
    return clean.length > 0 ? clean.slice(0, limit) : fallbackTravelKeywords(input);
  } catch {
    return fallbackTravelKeywords(input);
  }
}
