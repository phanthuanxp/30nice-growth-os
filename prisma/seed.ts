import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "30nice" },
    update: {},
    create: { name: "30Nice", slug: "30nice" },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@30nice.vn" },
    update: { passwordHash },
    create: {
      email: "admin@30nice.vn",
      name: "30Nice Admin",
      role: Role.SUPER_ADMIN,
      passwordHash,
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: {},
    create: { organizationId: org.id, userId: user.id, role: Role.SUPER_ADMIN },
  });

  const cms = await prisma.tenant.upsert({
    where: { slug: "cms-30nice" },
    update: {},
    create: {
      organizationId: org.id,
      name: "30Nice CMS Network",
      slug: "cms-30nice",
      primaryDomain: "cms.30nice.vn",
      businessName: "30Nice",
      businessEmail: "hello@30nice.vn",
      defaultSeoTitle: "30Nice Growth OS",
      defaultSeoDescription: "CMS, SEO AI, analytics, leads and automation for 30Nice websites.",
    },
  });

  const taxi = await prisma.tenant.upsert({
    where: { slug: "taxibacninh" },
    update: {},
    create: {
      organizationId: org.id,
      name: "Taxi Bắc Ninh",
      slug: "taxibacninh",
      primaryDomain: "taxibacninh.vn",
      businessPhone: "1900 30Nice",
      defaultSeoTitle: "Taxi Bắc Ninh - Đặt xe 24/7",
      defaultSeoDescription: "Dịch vụ taxi Bắc Ninh, xe riêng, giá trọn gói.",
    },
  });

  for (const tenant of [cms, taxi]) {
    await prisma.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: {},
      create: { tenantId: tenant.id, userId: user.id, role: Role.SUPER_ADMIN },
    });
    await prisma.domain.upsert({
      where: { host: tenant.primaryDomain! },
      update: {},
      create: { tenantId: tenant.id, host: tenant.primaryDomain!, primary: true, verified: true },
    });
    await prisma.siteSettings.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        phone: tenant.businessPhone,
        email: tenant.businessEmail,
        defaultSeoTitle: tenant.defaultSeoTitle,
        defaultSeoDescription: tenant.defaultSeoDescription,
      },
    });
  }

  await prisma.page.upsert({
    where: { tenantId_slug: { tenantId: cms.id, slug: "" } },
    update: {},
    create: {
      tenantId: cms.id,
      title: "30Nice Growth OS",
      slug: "",
      status: "PUBLISHED",
      summary: "Custom CMS homepage",
      uiBlocks: [
        {
          type: "hero",
          headline: "CMS thông minh cho website, SEO, AI content và lead.",
          subheadline: "Quản lý nhiều website từ một nơi.",
          ctaLabel: "Vào Dashboard",
          ctaHref: "/admin/dashboard",
        },
      ],
    },
  });

  const category = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: taxi.id, slug: "seo" } },
    update: {},
    create: { tenantId: taxi.id, name: "SEO", slug: "seo" },
  });

  await prisma.post.upsert({
    where: { tenantId_slug: { tenantId: taxi.id, slug: "checklist-seo-local-taxi" } },
    update: {},
    create: {
      tenantId: taxi.id,
      categoryId: category.id,
      title: "Checklist SEO local cho dịch vụ taxi",
      slug: "checklist-seo-local-taxi",
      excerpt: "Các việc cần làm để tăng hiển thị local.",
      content:
        "SEO local cần dữ liệu nhất quán, landing page rõ ràng, schema và nội dung hữu ích.",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  // Leads are created by contact forms, skip seeding to avoid duplicates
  const existingLead = await prisma.lead.findFirst({ where: { tenantId: taxi.id } });
  if (!existingLead) {
    await prisma.lead.create({
      data: {
        tenantId: taxi.id,
        name: "Anh Minh",
        phone: "09xx xxx xxx",
        message: "Cần xe 7 chỗ đi sân bay",
        sourcePath: "/taxi-bac-ninh",
        sourceDomain: "taxibacninh.vn",
      },
    });
  }

  console.log("✓ Seed complete. Admin: admin@30nice.vn / admin123");
}

main().finally(async () => prisma.$disconnect());
