import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { isLoopbackHost, normalizeHost } from "@/server/http/host-rules";

// Internal-only endpoint, called by the edge proxy over INTERNAL_BASE_URL.
// The proxy 404s /api/internal on every public hostname; the loopback check
// below is the second lock, so a misconfigured INTERNAL_BASE_URL or a proxy
// bypass still cannot expose it.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isLoopbackHost(normalizeHost(req.headers.get("host")))) {
    return new NextResponse(null, { status: 404 });
  }

  const host = req.nextUrl.searchParams.get("host");
  if (!host) return NextResponse.json([], { status: 200 });

  try {
    const domain = await prisma.domain.findUnique({
      where: { host },
      select: { tenantId: true },
    });
    const tenantId =
      domain?.tenantId ??
      (await prisma.tenant.findFirst({ where: { primaryDomain: host }, select: { id: true } }))?.id;

    if (!tenantId) return NextResponse.json([], { status: 200 });

    const rules = await prisma.redirectRule.findMany({
      where: { tenantId, active: true },
      select: { fromPath: true, toPath: true, statusCode: true },
    });

    return NextResponse.json(rules, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
