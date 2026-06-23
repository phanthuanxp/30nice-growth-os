import { hashContent } from "@/server/content/source-utils";

export type ExtractedArticle = {
  url: string;
  canonicalUrl?: string;
  title?: string;
  excerpt?: string;
  rawHtml: string;
  extractedText: string;
  imageUrl?: string;
  contentHash: string;
};

function pickMeta(html: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1].trim());
    }
  }
}

function pickTitle(html: string) {
  return pickMeta(html, ["og:title", "twitter:title"]) || decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "");
}

function pickCanonical(html: string) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
}

function pickMainHtml(html: string) {
  const article = html.match(/<article[\s\S]*?<\/article>/i)?.[0];
  if (article) return article;
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0];
  if (main) return main;
  return html;
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(html: string) {
  return decodeHtml(html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim());
}

function absolutize(maybeUrl: string | undefined, base: string) {
  if (!maybeUrl) return undefined;
  try { return new URL(maybeUrl, base).toString(); } catch { return maybeUrl; }
}

export async function extractArticleFromUrl(url: string): Promise<ExtractedArticle> {
  const response = await fetch(url, { headers: { "user-agent": "30NiceGrowthOS/1.0 (+admin.30nice.vn)" }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}`);
  const rawHtml = await response.text();
  const mainHtml = pickMainHtml(rawHtml);
  const extractedText = stripHtml(mainHtml);
  if (extractedText.length < 250) throw new Error("Extracted text too short");
  const canonicalUrl = absolutize(pickCanonical(rawHtml), url);
  const imageUrl = absolutize(pickMeta(rawHtml, ["og:image", "twitter:image"]), url);
  const title = pickTitle(rawHtml) || extractedText.split("\n")[0]?.slice(0, 120);
  const excerpt = pickMeta(rawHtml, ["description", "og:description", "twitter:description"]) || extractedText.slice(0, 220);
  return { url, canonicalUrl, title, excerpt, rawHtml: rawHtml.slice(0, 500000), extractedText, imageUrl, contentHash: hashContent(extractedText) };
}
