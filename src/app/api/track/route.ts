import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/server/db";

const BOT_PATTERN = /bot|crawler|spider|crawling|facebookexternalhit|slurp|lighthouse|pingdom|headless/i;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { path?: string; referrer?: string };
    const path = (body.path ?? "/").slice(0, 500);

    if (path.startsWith("/admin") || path.startsWith("/api") || path === "/login") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const h = await headers();
    const ua = h.get("user-agent") ?? "";
    if (BOT_PATTERN.test(ua)) return NextResponse.json({ ok: true, skipped: true });

    const host = h.get("host")?.replace(/^www\./, "") ?? "";

    let tenantId: string | null = null;
    const domain = await prisma.domain.findUnique({ where: { host }, select: { tenantId: true } });
    tenantId = domain?.tenantId ?? null;
    if (!tenantId) {
      const tenant = await prisma.tenant.findFirst({ where: { primaryDomain: host }, select: { id: true } });
      tenantId = tenant?.id ?? null;
    }
    if (!tenantId) return NextResponse.json({ ok: true, skipped: true });

    const device = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
    const referrer = body.referrer
      ? body.referrer.replace(/^https?:\/\//, "").split("/")[0].slice(0, 200)
      : null;

    await prisma.analyticsEvent.create({
      data: { tenantId, type: "pageview", path, referrer, device },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
