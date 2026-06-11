import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/server/db";

const schema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  message: z.string().max(2000).optional(),
  sourcePath: z.string().max(500).optional(),
  tenantId: z.string().optional(),
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

  const lead = await prisma.lead.create({
    data: {
      tenantId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      message: parsed.data.message,
      sourcePath: parsed.data.sourcePath,
      sourceDomain,
      status: "NEW",
    },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
