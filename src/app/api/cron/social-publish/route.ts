import { NextRequest, NextResponse } from "next/server";
import { processSocialPublishQueue } from "@/server/social/publisher";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get("x-cron-secret") === expected || request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results = await processSocialPublishQueue({ limit: 20 });
  return NextResponse.json({
    processed: results.length,
    published: results.filter((item) => item.status === "PUBLISHED").length,
    failed: results.filter((item) => item.status === "FAILED").length,
    skipped: results.filter((item) => item.status === "SKIPPED").length,
  });
}
