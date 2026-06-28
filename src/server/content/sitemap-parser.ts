export type DiscoveredUrl = { url: string; title?: string; lastmod?: string };

function stripCdata(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

export async function fetchSitemapUrls(sitemapUrl: string, maxUrls = 500): Promise<DiscoveredUrl[]> {
  const res = await fetch(sitemapUrl, {
    headers: { "user-agent": "30NiceGrowthOS/1.0 (+admin.30nice.vn)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${sitemapUrl}`);
  const xml = await res.text();

  // Sitemap index → recurse into sub-sitemaps
  if (/<sitemapindex/i.test(xml)) {
    const subLocs = [...xml.matchAll(/<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
    const all: DiscoveredUrl[] = [];
    for (const loc of subLocs.slice(0, 10)) {
      try {
        const sub = await fetchSitemapUrls(loc, maxUrls);
        all.push(...sub);
      } catch { /* skip failed sub-sitemaps */ }
      if (all.length >= maxUrls) break;
    }
    return all.slice(0, maxUrls);
  }

  // Regular sitemap
  const urlBlocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)];
  const results: DiscoveredUrl[] = [];
  for (const block of urlBlocks) {
    const inner = block[1];
    const loc = inner.match(/<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/i)?.[1]?.trim();
    if (!loc) continue;
    const lastmod = inner.match(/<lastmod>\s*([^\s<]+)\s*<\/lastmod>/i)?.[1]?.trim();
    results.push({ url: loc, lastmod });
    if (results.length >= maxUrls) break;
  }
  return results;
}

export async function fetchRssUrls(feedUrl: string, maxUrls = 200): Promise<DiscoveredUrl[]> {
  const res = await fetch(feedUrl, {
    headers: { "user-agent": "30NiceGrowthOS/1.0 (+admin.30nice.vn)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${feedUrl}`);
  const xml = await res.text();

  // Atom feed
  if (/<feed[\s>]/i.test(xml)) {
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)];
    const results: DiscoveredUrl[] = [];
    for (const entry of entries) {
      const inner = entry[1];
      const href =
        inner.match(/<link[^>]+href=["']([^"']+)["'][^>]*(?:\/>|>)/i)?.[1]?.trim() ||
        inner.match(/<id>\s*(https?:\/\/[^\s<]+)\s*<\/id>/i)?.[1]?.trim();
      const title = stripCdata(inner.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
      if (href) results.push({ url: href, title: title || undefined });
      if (results.length >= maxUrls) break;
    }
    return results;
  }

  // RSS 2.0
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const results: DiscoveredUrl[] = [];
  for (const item of items) {
    const inner = item[1];
    const link =
      inner.match(/<link>\s*(https?:\/\/[^\s<]+)\s*<\/link>/i)?.[1]?.trim() ||
      inner.match(/<guid[^>]*isPermaLink=["']true["'][^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/guid>/i)?.[1]?.trim() ||
      inner.match(/<guid[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/guid>/i)?.[1]?.trim();
    const title = stripCdata(inner.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
    if (link) results.push({ url: link, title: title || undefined });
    if (results.length >= maxUrls) break;
  }
  return results;
}
