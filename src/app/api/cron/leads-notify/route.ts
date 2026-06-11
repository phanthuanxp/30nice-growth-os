import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find tenants with lead_notify integrations configured
  const integrations = await prisma.integration.findMany({
    where: { provider: "webhook_lead_notify", status: "ACTIVE" },
    include: { tenant: { select: { id: true, name: true } } },
  });

  const results = [];

  for (const integration of integrations) {
    const config = integration.config as { webhookUrl?: string; lastNotifiedAt?: string } | null;
    if (!config?.webhookUrl) continue;

    const lastAt = config.lastNotifiedAt ? new Date(config.lastNotifiedAt) : new Date(0);

    const newLeads = await prisma.lead.findMany({
      where: { tenantId: integration.tenantId, createdAt: { gt: lastAt } },
    });

    if (newLeads.length === 0) {
      results.push({ tenant: integration.tenant.name, sent: 0 });
      continue;
    }

    try {
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "new_leads",
          site: integration.tenant.name,
          count: newLeads.length,
          leads: newLeads.map((l) => ({
            name: l.name,
            phone: l.phone,
            email: l.email,
            message: l.message,
            source: l.sourcePath,
            createdAt: l.createdAt,
          })),
        }),
      });

      if (res.ok) {
        await prisma.integration.update({
          where: { id: integration.id },
          data: { config: { ...config, lastNotifiedAt: new Date().toISOString() } },
        });
      }

      results.push({ tenant: integration.tenant.name, sent: newLeads.length, status: res.status });
    } catch (e) {
      results.push({ tenant: integration.tenant.name, error: e instanceof Error ? e.message : "Lỗi" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
