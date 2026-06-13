import { headers } from "next/headers";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const host = (await headers()).get("host")?.replace(/^www\./, "") ?? "";
  const base = `https://${host}`;

  let urls: { loc: string; lastmod?: string; priority: string; changefreq: string }[] = [
    { loc: `${base}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${base}/blog`, priority: "0.8", changefreq: "daily" },
  ];

  try {
    const domain = await prisma.domain.findUnique({ where: { host }, select: { tenantId: true } });
    const tenant = domain
      ? { id: domain.tenantId }
      : await prisma.tenant.findFirst({ where: { primaryDomain: host }, select: { id: true } });

    if (tenant) {
      const [pages, posts] = await Promise.all([
        prisma.page.findMany({
          where: { tenantId: tenant.id, status: "PUBLISHED" },
          select: { slug: true, updatedAt: true },
        }),
        prisma.post.findMany({
          where: { tenantId: tenant.id, status: "PUBLISHED" },
          select: { slug: true, updatedAt: true },
        }),
      ]);

      urls = urls.concat(
        pages
          .filter((p) => p.slug !== "")
          .map((p) => ({
            loc: `${base}/${xmlEscape(p.slug)}`,
            lastmod: p.updatedAt.toISOString(),
            priority: "0.7",
            changefreq: "weekly",
          })),
        posts.map((p) => ({
          loc: `${base}/blog/${xmlEscape(p.slug)}`,
          lastmod: p.updatedAt.toISOString(),
          priority: "0.6",
          changefreq: "monthly",
        }))
      );
    }
  } catch {
    // DB unavailable — serve base urls only
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
