import { aiGenerate } from "@/server/ai/generate";
import type { SeoIntent } from "@prisma/client";

const INTENT_SYSTEM = `Bạn là chuyên gia SEO. Phân loại từ khóa theo search intent. Trả về JSON array, mỗi phần tử là {"keyword":"...","intent":"INFORMATIONAL"|"NAVIGATIONAL"|"COMMERCIAL"|"TRANSACTIONAL"}. Chỉ trả JSON thuần, không markdown.`;

export async function classifyIntents(
  keywords: string[],
): Promise<Array<{ keyword: string; intent: SeoIntent }>> {
  if (keywords.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < keywords.length; i += 30) {
    batches.push(keywords.slice(i, i + 30));
  }

  const results: Array<{ keyword: string; intent: SeoIntent }> = [];

  for (const batch of batches) {
    try {
      const prompt = `Phân loại intent cho các từ khóa sau:\n${batch.map((k, i) => `${i + 1}. ${k}`).join("\n")}`;
      const { text } = await aiGenerate(INTENT_SYSTEM, prompt);

      const jsonStr = text.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(jsonStr) as Array<{ keyword: string; intent: string }>;

      for (const item of parsed) {
        const intent = (item.intent ?? "INFORMATIONAL").toUpperCase() as SeoIntent;
        const valid: SeoIntent[] = ["INFORMATIONAL", "NAVIGATIONAL", "COMMERCIAL", "TRANSACTIONAL"];
        results.push({ keyword: item.keyword, intent: valid.includes(intent) ? intent : "INFORMATIONAL" });
      }
    } catch {
      // Fallback: mark as INFORMATIONAL
      for (const kw of batch) {
        results.push({ keyword: kw, intent: "INFORMATIONAL" });
      }
    }
  }

  return results;
}
