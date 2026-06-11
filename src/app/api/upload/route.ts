import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/server/auth/session";
import { prisma } from "@/server/db";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tenantId = formData.get("tenantId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Loại file không hợp lệ. Chỉ chấp nhận JPG, PNG, GIF, WebP, SVG." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File quá lớn. Tối đa 10MB." }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}_${safe}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", tenantId);

  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

  const url = `/api/files/${tenantId}/${filename}`;
  const alt = formData.get("alt") as string | undefined;

  const asset = await prisma.mediaAsset.create({
    data: {
      tenantId,
      url,
      filename,
      mimeType: file.type,
      size: file.size,
      alt: alt ?? null,
    },
  });

  return NextResponse.json({ id: asset.id, url, filename, mimeType: file.type, size: file.size });
}
