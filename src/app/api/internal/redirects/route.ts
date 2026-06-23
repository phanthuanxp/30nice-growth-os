import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

// Internal-only endpoint — only callable from proxy (same process/host).
// No auth header needed since it's behind the same origin.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
