import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for prisma seed");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@30nice.vn";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
    console.warn("WARNING: ADMIN_PASSWORD is not set; using the development fallback password.");
  }

  const org = await prisma.organization.upsert({
    where: { slug: "30nice" },
    update: { name: "30Nice" },
    create: { name: "30Nice", slug: "30nice" },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "30Nice Admin",
      role: Role.SUPER_ADMIN,
      passwordHash,
    },
    create: {
      email: adminEmail,
      name: "30Nice Admin",
      role: Role.SUPER_ADMIN,
      passwordHash,
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: { role: Role.SUPER_ADMIN },
    create: { organizationId: org.id, userId: user.id, role: Role.SUPER_ADMIN },
  });

  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  for (const tenant of tenants) {
    await prisma.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: { role: Role.SUPER_ADMIN },
      create: { tenantId: tenant.id, userId: user.id, role: Role.SUPER_ADMIN },
    });
  }

  console.log(`✓ Seed complete. SUPER_ADMIN ensured for ${adminEmail}.`);
  console.log("Set ADMIN_PASSWORD in the environment before running seed in production.");
}

main().finally(async () => prisma.$disconnect());
