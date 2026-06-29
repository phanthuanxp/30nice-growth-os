import { prisma } from "@/server/db";
import type { TenantStatus } from "@prisma/client";

export async function getTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { pages: true, posts: true } },
      domains: { where: { primary: true }, take: 1 },
    },
  });
}

export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      settings: true,
      domains: true,
      _count: { select: { pages: true, posts: true } },
    },
  });
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function getTenantByDomain(host: string) {
  const domain = await prisma.domain.findUnique({
    where: { host },
    include: { tenant: true },
  });
  if (domain?.tenant) return domain.tenant;

  return prisma.tenant.findFirst({ where: { primaryDomain: host } });
}

export async function getTenantBySubdomain(subdomain: string) {
  const sub = subdomain.toLowerCase();
  if (!sub) return null;
  return prisma.tenant.findFirst({
    where: {
      OR: [
        { slug: sub },
        { domains: { some: { host: { startsWith: `${sub}.` } } } },
      ],
    },
  });
}

export type CreateTenantInput = {
  name: string;
  slug: string;
  primaryDomain?: string;
  status?: TenantStatus;
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  brandPrimary?: string;
  brandSecondary?: string;
};

export async function createTenant(orgId: string, data: CreateTenantInput) {
  return prisma.tenant.create({
    data: {
      organizationId: orgId,
      ...data,
    },
  });
}

export async function updateTenant(id: string, data: Partial<CreateTenantInput>) {
  return prisma.tenant.update({ where: { id }, data });
}

export async function deleteTenant(id: string) {
  return prisma.tenant.delete({ where: { id } });
}
