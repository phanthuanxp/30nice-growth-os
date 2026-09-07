import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/server/http/cron-auth";
import { processSocialPublishQueue } from "@/server/social/publisher";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results = await processSocialPublishQueue({ limit: 20 });
  return NextResponse.json({
    processed: results.length,
    published: results.filter((item) => item.status === "PUBLISHED").length,
    failed: results.filter((item) => item.status === "FAILED").length,
    skipped: results.filter((item) => item.status === "SKIPPED").length,
    manualRequired: results.filter((item) => item.status === "MANUAL_REQUIRED").length,
  });
}
