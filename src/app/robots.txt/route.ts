import { headers } from "next/headers";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

const DEFAULT_RULES = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /login`;

export async function GET() {
  const host = (await headers()).get("host")?.replace(/^www\./, "") ?? "";

  let rules = DEFAULT_RULES;
  try {
    const domain = await prisma.domain.findUnique({ where: { host }, select: { tenantId: true } });
    const tenant = domain
      ? { id: domain.tenantId }
      : await prisma.tenant.findFirst({ where: { primaryDomain: host }, select: { id: true } });

    if (tenant) {
      const integration = await prisma.integration.findFirst({
        where: { tenantId: tenant.id, provider: "robots_txt" },
        select: { config: true },
      });
      const custom = (integration?.config as { content?: string } | null)?.content;
      if (custom && custom.trim().length > 0) rules = custom.trim();
    }
  } catch {
    // DB unavailable — defaults
  }

  const body = `${rules}\n\nSitemap: https://${host}/sitemap.xml\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
