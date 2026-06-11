import { NextRequest, NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/server/auth/session";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

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

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    // URL is /api/files/{tenantId}/{filename} — map to public/uploads/{tenantId}/{filename}
    const urlPath = asset.url.replace(/^\/api\/files\//, "");
    const filePath = path.join(process.cwd(), "public", "uploads", urlPath);
    await unlink(filePath);
  } catch { /* file may already be gone */ }

  await prisma.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
