import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const baseFields = [
  { name: "name", label: "Họ tên", type: "text", required: true },
  { name: "phone", label: "Số điện thoại", type: "tel", required: true },
  { name: "message", label: "Nhu cầu", type: "textarea", required: false },
];

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  for (const tenant of tenants) {
    await prisma.form.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: "booking" } },
      update: {
        name: "Form đặt xe",
        description: "Form đặt xe mặc định cho website",
        fields: baseFields,
        active: true,
      },
      create: {
        tenantId: tenant.id,
        name: "Form đặt xe",
        slug: "booking",
        description: "Form đặt xe mặc định cho website",
        fields: baseFields,
        settings: { createLead: true, notify: true },
        active: true,
      },
    });

    await prisma.form.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: "contact" } },
      update: {
        name: "Form liên hệ",
        description: "Form liên hệ mặc định cho website",
        fields: baseFields,
        active: true,
      },
      create: {
        tenantId: tenant.id,
        name: "Form liên hệ",
        slug: "contact",
        description: "Form liên hệ mặc định cho website",
        fields: baseFields,
        settings: { createLead: true, notify: true },
        active: true,
      },
    });
  }

  console.log(`✓ Default forms ensured for ${tenants.length} tenant(s).`);
}

main().finally(async () => prisma.$disconnect());
