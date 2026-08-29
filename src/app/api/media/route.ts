import { NextRequest, NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import { getSession } from "@/server/auth/session";
import { checkTenantAccess } from "@/server/permissions/guard";
import { resolveUploadPath } from "@/server/media/paths";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  if (!(await checkTenantAccess(tenantId, "VIEWER"))) {
    return NextResponse.json({ error: "Không có quyền với site này" }, { status: 403 });
  }

  const assets = await prisma.mediaAsset.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(assets);
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body === "object" && body !== null ? (body as { id?: unknown }).id : null;
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await checkTenantAccess(asset.tenantId, "EDITOR"))) {
    return NextResponse.json({ error: "Không có quyền với site này" }, { status: 403 });
  }

  try {
    // URL is /api/files/{tenantId}/{filename} — map to public/uploads/{tenantId}/{filename}
    const filePath = resolveUploadPath(asset.url.replace(/^\/api\/files\//, "").split("/"));
    if (filePath) await unlink(filePath);
  } catch { /* file may already be gone */ }

  await prisma.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
