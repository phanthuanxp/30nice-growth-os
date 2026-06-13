import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import type { SessionUser } from "@/server/auth/session";

type AuditInput = {
  user?: Pick<SessionUser, "id"> | null;
  userId?: string | null;
  tenantId?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? input.user?.id ?? null,
        tenantId: input.tenantId ?? null,
        action: input.action,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch {
    // Audit logging must never break the primary user action.
  }
}
