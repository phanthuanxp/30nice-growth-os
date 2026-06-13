import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/server/db";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().optional(),
  message: z.string().trim().max(2000).optional(),
  sourcePath: z.string().max(500).optional(),
  tenantId: z.string().optional(),
  formSlug: z.string().max(120).optional(),
  sourceType: z.string().max(80).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(160).optional(),
}).refine((data) => Boolean(data.phone || data.email), {
  message: "Cần số điện thoại hoặc email",
  path: ["phone"],
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const headerStore = await headers();
  const sourceDomain =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    undefined;
  const userAgent = headerStore.get("user-agent") ?? undefined;
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
  const ipHash = forwardedFor
    ? crypto.createHash("sha256").update(forwardedFor.split(",")[0].trim()).digest("hex")
    : undefined;

  // Resolve tenant by domain if tenantId not provided
  let tenantId = parsed.data.tenantId;
  if (!tenantId && sourceDomain) {
    const domain = sourceDomain.replace(/:\d+$/, "").replace(/^www\./, "");
    const tenant = await prisma.tenant
      .findFirst({ where: { primaryDomain: domain } })
      .catch(() => null);
    tenantId = tenant?.id;
  }

  if (!tenantId) {
    // Fallback: use first available tenant
    const fallback = await prisma.tenant
      .findFirst({ where: { status: "ACTIVE" } })
      .catch(() => null);
    tenantId = fallback?.id;
  }

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }

  const form = parsed.data.formSlug
    ? await prisma.form.findUnique({ where: { tenantId_slug: { tenantId, slug: parsed.data.formSlug } }, select: { id: true } }).catch(() => null)
    : null;

  const lead = await prisma.lead.create({
    data: {
      tenantId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      message: parsed.data.message,
      sourcePath: parsed.data.sourcePath,
      sourceDomain,
      sourceType: parsed.data.sourceType ?? "contact_form",
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      status: "NEW",
      lastActivityAt: new Date(),
    },
  });

  await prisma.leadActivity.create({
    data: {
      tenantId,
      leadId: lead.id,
      type: "created",
      title: "Lead mới từ form liên hệ",
      metadata: { sourceDomain, sourcePath: parsed.data.sourcePath },
    },
  }).catch(() => null);

  await prisma.formSubmission.create({
    data: {
      tenantId,
      formId: form?.id ?? null,
      leadId: lead.id,
      payload: parsed.data,
      sourcePath: parsed.data.sourcePath,
      sourceDomain,
      userAgent,
      ipHash,
    },
  }).catch(() => null);

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
