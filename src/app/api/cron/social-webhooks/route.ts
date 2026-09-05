import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/server/http/cron-auth";
import { processSocialWebhookEvents } from "@/server/social/webhook-processor";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await processSocialWebhookEvents(200));
}
