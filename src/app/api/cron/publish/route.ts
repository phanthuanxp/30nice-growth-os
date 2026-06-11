import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const scheduled = await prisma.post.findMany({
    where: { status: "DRAFT", publishedAt: { lte: now, not: null } },
    select: { id: true, title: true, tenantId: true },
  });

  if (scheduled.length === 0) {
    return NextResponse.json({ published: 0, message: "Không có bài lên lịch" });
  }

  await prisma.post.updateMany({
    where: { id: { in: scheduled.map((p) => p.id) } },
    data: { status: "PUBLISHED" },
  });

  revalidatePath("/admin/blog");

  return NextResponse.json({
    published: scheduled.length,
    posts: scheduled.map((p) => ({ id: p.id, title: p.title })),
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
