import { prisma } from "@/server/db";
import type { Role } from "@prisma/client";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      organizationMembers: { include: { organization: { select: { id: true, name: true, slug: true } } } },
      tenantMembers: { include: { tenant: { select: { id: true, name: true, slug: true } } } },
    },
  });
}

export async function listUsers(opts?: { search?: string; role?: Role }) {
  const where: Record<string, unknown> = {};
  if (opts?.role) where.role = opts.role;
  if (opts?.search) {
    const s = opts.search.trim();
    if (s) {
      where.OR = [
        { email: { contains: s, mode: "insensitive" } },
        { name: { contains: s, mode: "insensitive" } },
      ];
    }
  }
  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { organizationMembers: true, tenantMembers: true } },
    },
  });
}

export async function createUser(data: {
  email: string;
  name?: string;
  passwordHash: string;
  role?: Role;
}) {
  return prisma.user.create({ data });
}

export async function updateUser(
  id: string,
  data: { name?: string; role?: Role; passwordHash?: string }
) {
  return prisma.user.update({ where: { id }, data });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function countUsers() {
  return prisma.user.count();
}
