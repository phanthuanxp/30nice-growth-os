import { prisma } from "@/server/db";

export async function listFormSubmissions(tenantId: string, limit = 50) {
  return prisma.formSubmission.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      form: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function countFormSubmissions(tenantId: string) {
  return prisma.formSubmission.count({ where: { tenantId } });
}

export async function listForms(tenantId: string) {
  return prisma.form.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { submissions: true } },
    },
  });
}

export async function getForm(id: string, tenantId: string) {
  return prisma.form.findFirst({
    where: { id, tenantId },
    include: {
      _count: { select: { submissions: true } },
    },
  });
}
