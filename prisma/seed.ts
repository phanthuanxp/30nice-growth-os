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

  if (process.env.SEED_SOCIAL_DEMO === "true" && tenants[0]) {
    const tenantId = tenants[0].id;
    const workspace = await prisma.socialWorkspace.upsert({
      where: { tenantId_slug: { tenantId, slug: "30nice-social-network" } },
      update: { name: "30Nice Social Network", status: "ACTIVE" },
      create: {
        tenantId,
        name: "30Nice Social Network",
        slug: "30nice-social-network",
        status: "ACTIVE",
        objective: "Xây dựng hệ thống Page theo từng lĩnh vực kinh doanh và thu lead về Growth OS.",
      },
    });

    const demoPages = [
      { name: "30Nice Travel", slug: "30nice-travel", category: "Du lịch và thuê xe", audience: "Khách du lịch và khách cần thuê xe tại Việt Nam" },
      { name: "30Nice Beauty Spa", slug: "30nice-beauty-spa", category: "Làm đẹp và chăm sóc sức khỏe", audience: "Phụ nữ quan tâm chăm sóc da, thư giãn và làm đẹp" },
      { name: "Chuyển Phát 24H", slug: "chuyen-phat-24h", category: "Chuyển phát nhanh", audience: "Cá nhân và doanh nghiệp cần giao hàng nhanh liên tỉnh" },
    ];

    for (const item of demoPages) {
      await prisma.socialPage.upsert({
        where: { workspaceId_slug: { workspaceId: workspace.id, slug: item.slug } },
        update: { name: item.name, category: item.category },
        create: {
          workspaceId: workspace.id,
          name: item.name,
          slug: item.slug,
          category: item.category,
          objective: "Xây nền nội dung, tăng nhận diện và tạo khách hàng tiềm năng.",
          targetAudience: { summary: item.audience },
          brandVoice: { summary: "Thân thiện, thực tế, đáng tin cậy" },
          contentPillars: [
            { key: "education", label: "Kiến thức hữu ích", ratio: 35 },
            { key: "trust", label: "Niềm tin & câu chuyện thật", ratio: 25 },
            { key: "conversion", label: "Dịch vụ & chuyển đổi", ratio: 25 },
            { key: "engagement", label: "Tương tác cộng đồng", ratio: 15 },
          ],
          postingRules: { approvalRequired: true, maxPostsPerDay: 2 },
        },
      });
    }
    console.log("✓ Optional Social Growth OS demo workspace ensured.");
  }

  console.log(`✓ Seed complete. SUPER_ADMIN ensured for ${adminEmail}.`);
  console.log("Set ADMIN_PASSWORD in the environment before running seed in production.");
}

main().finally(async () => prisma.$disconnect());
