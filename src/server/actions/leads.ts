"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { updateLeadStatus } from "@/server/queries/leads";
import { requireTenantAccess } from "@/server/permissions/guard";

const updateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "LOST", "WON"]),
  notes: z.string().max(2000).optional(),
});

export type LeadActionState = { success?: boolean; error?: string };

export async function updateLeadAction(
  id: string,
  _prev: LeadActionState,
  formData: FormData
): Promise<LeadActionState> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dữ liệu không hợp lệ" };

  try {
    const { prisma } = await import("@/server/db");
    const lead = await prisma.lead.findUnique({ where: { id }, select: { tenantId: true } });
    if (!lead) return { error: "Không tìm thấy lead" };
    await requireTenantAccess(lead.tenantId, "EDITOR");
    await updateLeadStatus(id, parsed.data.status, parsed.data.notes, user.id);
    revalidatePath("/admin/leads");
    return { success: true };
  } catch {
    return { error: "Lỗi khi cập nhật lead" };
  }
}

const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "LOST", "WON"]),
});

export async function bulkUpdateLeadStatusAction(
  tenantId: string,
  ids: string[],
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON"
): Promise<LeadActionState> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  const parsed = bulkStatusSchema.safeParse({ ids, status });
  if (!parsed.success) return { error: "Dữ liệu không hợp lệ" };

  try {
    const { prisma } = await import("@/server/db");
    await requireTenantAccess(tenantId, "EDITOR");
    const leads = await prisma.lead.findMany({ where: { id: { in: parsed.data.ids }, tenantId }, select: { id: true, status: true } });
    await prisma.lead.updateMany({
      where: { id: { in: parsed.data.ids }, tenantId },
      data: { status: parsed.data.status, lastActivityAt: new Date() },
    });
    await prisma.leadStatusHistory.createMany({
      data: leads.map((lead) => ({ tenantId, leadId: lead.id, fromStatus: lead.status, toStatus: parsed.data.status, changedById: user.id })),
      skipDuplicates: true,
    }).catch(() => null);
    await prisma.leadActivity.createMany({
      data: leads.map((lead) => ({ tenantId, leadId: lead.id, type: "status_change", title: `Đổi trạng thái: ${lead.status} → ${parsed.data.status}` })),
      skipDuplicates: true,
    }).catch(() => null);
    revalidatePath(`/admin/sites/${tenantId}/leads`);
    revalidatePath("/admin/leads");
    return { success: true };
  } catch {
    return { error: "Lỗi khi cập nhật hàng loạt" };
  }
}

export async function moveLeadAction(
  leadId: string,
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON",
  tenantId: string
): Promise<LeadActionState> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  try {
    const { prisma } = await import("@/server/db");
    await requireTenantAccess(tenantId, "EDITOR");
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, status: true, tenantId: true } });
    if (!lead || lead.tenantId !== tenantId) return { error: "Không tìm thấy lead" };
    if (lead.status === status) return { success: true };

    await prisma.lead.update({ where: { id: leadId }, data: { status, lastActivityAt: new Date() } });
    await prisma.leadStatusHistory.create({
      data: { tenantId, leadId, fromStatus: lead.status, toStatus: status, changedById: user.id },
    }).catch(() => null);
    await prisma.leadActivity.create({
      data: { tenantId, leadId, type: "status_change", title: `Kéo kanban: ${lead.status} → ${status}` },
    }).catch(() => null);

    revalidatePath(`/admin/sites/${tenantId}/leads`);
    return { success: true };
  } catch {
    return { error: "Lỗi khi di chuyển lead" };
  }
}

export async function addLeadNoteAction(
  tenantId: string,
  leadId: string,
  body: string
): Promise<LeadActionState> {
  const user = await requireAuth();
  if (!can(user.role, "EDITOR")) return { error: "Không đủ quyền" };

  const text = body.trim();
  if (!text || text.length > 2000) return { error: "Ghi chú không hợp lệ" };

  try {
    const { prisma } = await import("@/server/db");
    await requireTenantAccess(tenantId, "EDITOR");
    const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId }, select: { id: true } });
    if (!lead) return { error: "Không tìm thấy lead" };

    await prisma.leadNote.create({ data: { tenantId, leadId, body: text, authorId: user.id } });
    await prisma.leadActivity.create({
      data: { tenantId, leadId, type: "note", title: "Thêm ghi chú", detail: text },
    });
    await prisma.lead.update({ where: { id: leadId }, data: { lastActivityAt: new Date() } });
    revalidatePath(`/admin/sites/${tenantId}/leads`);
    return { success: true };
  } catch {
    return { error: "Lỗi khi thêm ghi chú" };
  }
}

export async function bulkDeleteLeadsAction(
  tenantId: string,
  ids: string[]
): Promise<LeadActionState> {
  const user = await requireAuth();
  if (!can(user.role, "TENANT_ADMIN")) return { error: "Không đủ quyền" };
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) return { error: "Dữ liệu không hợp lệ" };

  try {
    const { prisma } = await import("@/server/db");
    await requireTenantAccess(tenantId, "TENANT_ADMIN");
    await prisma.lead.deleteMany({ where: { id: { in: ids }, tenantId } });
    revalidatePath(`/admin/sites/${tenantId}/leads`);
    revalidatePath("/admin/leads");
    return { success: true };
  } catch {
    return { error: "Lỗi khi xóa hàng loạt" };
  }
}
