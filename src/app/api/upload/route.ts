import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/server/auth/session";
import { checkTenantAccess } from "@/server/permissions/guard";
import { resolveUploadPath, safeFilename } from "@/server/media/paths";
import { prisma } from "@/server/db";

// SVG is deliberately excluded: it is an active document and these files are
// served back from the admin origin, so an uploaded SVG would be stored XSS.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tenantId = formData.get("tenantId");

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (typeof tenantId !== "string" || !tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Loại file không hợp lệ. Chỉ chấp nhận JPG, PNG, GIF, WebP." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File quá lớn. Tối đa 10MB." }, { status: 400 });
  }

  // Also pins tenantId to a real, permitted tenant id, so it can never be used
  // to walk out of the uploads directory.
  if (!(await checkTenantAccess(tenantId, "EDITOR"))) {
    return NextResponse.json({ error: "Không có quyền với site này" }, { status: 403 });
  }

  const filename = `${Date.now()}_${safeFilename(file.name)}`;
  const destination = resolveUploadPath([tenantId, filename]);
  if (!destination) return NextResponse.json({ error: "Đường dẫn tệp không hợp lệ" }, { status: 400 });

  await mkdir(path.dirname(destination), { recursive: true });
  const bytes = await file.arrayBuffer();
  let buffer: Uint8Array = Buffer.from(bytes);
  let finalSize = file.size;

  // Compress raster images: cap width 1920px, re-encode at quality 82
  if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    try {
      const { default: sharp } = await import("sharp");
      const pipeline = sharp(buffer, { failOn: "none" }).rotate().resize({
        width: 1920,
        withoutEnlargement: true,
      });
      const optimized =
        file.type === "image/png"
          ? await pipeline.png({ quality: 82, compressionLevel: 9 }).toBuffer()
          : file.type === "image/webp"
            ? await pipeline.webp({ quality: 82 }).toBuffer()
            : await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      if (optimized.length < buffer.length) {
        buffer = optimized;
        finalSize = optimized.length;
      }
    } catch {
      // sharp unavailable or corrupt image — keep original bytes
    }
  }

  await writeFile(destination, buffer);

  const url = `/api/files/${tenantId}/${filename}`;
  const alt = formData.get("alt");

  const asset = await prisma.mediaAsset.create({
    data: {
      tenantId,
      url,
      filename,
      mimeType: file.type,
      size: finalSize,
      alt: typeof alt === "string" && alt ? alt : null,
    },
  });

  return NextResponse.json({ id: asset.id, url, filename, mimeType: file.type, size: finalSize });
}
