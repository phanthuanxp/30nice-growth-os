import { prisma } from "@/server/db";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: {
  email: string;
  name?: string;
  passwordHash: string;
  role?: "SUPER_ADMIN" | "AGENCY_ADMIN" | "TENANT_ADMIN" | "EDITOR" | "VIEWER";
}) {
  return prisma.user.create({ data });
}
