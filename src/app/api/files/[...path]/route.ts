import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveUploadPath } from "@/server/media/paths";

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;
  const filePath = resolveUploadPath(pathParts);
  if (!filePath) return new NextResponse(null, { status: 403 });

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // These files live on the admin origin. Uploading SVG is no longer allowed,
      // but assets stored before that change must not be able to run script.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    });
    if (contentType === "image/svg+xml") {
      headers.set("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
    }
    return new NextResponse(data, { headers });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
