import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { requireTenantAccess } from "@/server/permissions/guard";
import { processSocialPublishQueue } from "@/server/social/publisher";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ targetId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "targetId không hợp lệ" }, { status: 400 });
  const target = await prisma.socialPublishTarget.findUnique({ where: { id: parsed.data.targetId }, include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } } });
  if (!target) return NextResponse.json({ error: "Không tìm thấy publish target" }, { status: 404 });
  await requireTenantAccess(target.socialPage.workspace.tenantId, "TENANT_ADMIN");
  const results = await processSocialPublishQueue({ targetId: target.id, limit: 1 });
  return NextResponse.json({ results });
}
