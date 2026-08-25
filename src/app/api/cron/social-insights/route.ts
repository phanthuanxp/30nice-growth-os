import { NextRequest, NextResponse } from "next/server";
import { syncSocialPostInsights } from "@/server/social/publisher";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authorized = Boolean(expected) && (request.headers.get("x-cron-secret") === expected || request.headers.get("authorization") === `Bearer ${expected}`);
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await syncSocialPostInsights(50));
}
