import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectMetaPageFromOAuthSession } from "@/server/meta/pages-service";

export const dynamic = "force-dynamic";

const schema = z.object({ oauthSessionId: z.string().min(1), externalPageId: z.string().min(1) });

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dữ liệu kết nối Page không hợp lệ" }, { status: 400 });
    const result = await connectMetaPageFromOAuthSession(parsed.data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return errorResponse(error);
  }
}
