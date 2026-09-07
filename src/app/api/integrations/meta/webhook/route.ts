import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db";
import { secretsMatch } from "@/server/http/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const supplied = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  if (!verifyToken || mode !== "subscribe" || !secretsMatch(supplied, verifyToken) || !challenge) return new NextResponse("Forbidden", { status: 403 });
  return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
}

const webhookSchema = z.object({
  object: z.literal("page"),
  entry: z.array(z.object({ id: z.string().optional(), changes: z.array(z.object({ field: z.string().optional(), value: z.unknown() })).optional() })).max(500),
});

function validSignature(rawBody: string, supplied: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !supplied?.startsWith("sha256=")) return false;
  const actual = Buffer.from(supplied.slice(7), "hex");
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > 1_000_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (!validSignature(rawBody, request.headers.get("x-hub-signature-256"))) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let json: unknown;
  try { json = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = webhookSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Unsupported webhook payload" }, { status: 400 });

  const rows = parsed.data.entry.flatMap((entry, entryIndex) => (entry.changes || []).map((change, changeIndex) => ({
    eventHash: createHash("sha256").update(`${rawBody}:${entryIndex}:${changeIndex}`).digest("hex"),
    externalPageId: entry.id || null,
    field: change.field || null,
    payload: JSON.parse(JSON.stringify({ value: change.value ?? null })) as Prisma.InputJsonValue,
  })));
  if (rows.length) await prisma.socialWebhookEvent.createMany({ data: rows, skipDuplicates: true });
  return NextResponse.json({ received: rows.length });
}
