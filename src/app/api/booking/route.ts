import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { dispatchLeadNotifications } from "@/lib/notifications";
import type { NotificationConfig } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name: string;
      phone: string;
      message?: string;
      sourceType?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };

    if (!body.name || !body.phone) {
      return NextResponse.json({ error: "Thiếu tên hoặc số điện thoại" }, { status: 400 });
    }

    const headerStore = await headers();
    const host = headerStore.get("host")?.replace(/^www\./, "") ?? "";
    const userAgent = headerStore.get("user-agent") ?? undefined;
    const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
    const ipHash = forwardedFor
      ? crypto.createHash("sha256").update(forwardedFor.split(",")[0].trim()).digest("hex")
      : undefined;

    let tenantId: string | null = null;
    try {
      const domain = await prisma.domain.findUnique({
        where: { host },
        select: { tenantId: true },
      });
      tenantId = domain?.tenantId ?? null;

      if (!tenantId) {
        const tenant = await prisma.tenant.findFirst({
          where: { primaryDomain: host },
          select: { id: true },
        });
        tenantId = tenant?.id ?? null;
      }
    } catch { /* DB unavailable */ }

    if (!tenantId) {
      return NextResponse.json({ ok: true, note: "no-tenant" });
    }

    // Save lead and raw form submission
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name: body.name,
        phone: body.phone,
        message: body.message ?? null,
        sourcePath: "/",
        sourceDomain: host,
        sourceType: body.sourceType ?? "booking_form",
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        status: "NEW",
        lastActivityAt: new Date(),
      },
    });

    await prisma.leadActivity.create({
      data: {
        tenantId,
        leadId: lead.id,
        type: "created",
        title: "Lead mới từ form đặt xe",
        metadata: { sourceDomain: host, sourcePath: "/" },
      },
    }).catch(() => null);

    const bookingForm = await prisma.form.findUnique({
      where: { tenantId_slug: { tenantId, slug: "booking" } },
      select: { id: true },
    }).catch(() => null);

    await prisma.formSubmission.create({
      data: {
        tenantId,
        formId: bookingForm?.id ?? null,
        leadId: lead.id,
        payload: body,
        sourcePath: "/",
        sourceDomain: host,
        userAgent,
        ipHash,
      },
    }).catch(() => null);

    // Dispatch notifications (non-blocking)
    try {
      const integration = await prisma.integration.findFirst({
        where: { tenantId, provider: "lead_notifications" },
        select: { config: true, status: true },
      });

      if (integration?.status === "CONNECTED" && integration.config) {
        const config = integration.config as NotificationConfig;
        dispatchLeadNotifications(config, {
          name: body.name,
          phone: body.phone,
          message: body.message,
          sourceDomain: host,
        }).catch(console.error);
      }
    } catch { /* notifications optional */ }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Booking API error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
