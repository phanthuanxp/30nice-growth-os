"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { updateLeadStatus } from "@/server/queries/leads";

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
    await updateLeadStatus(id, parsed.data.status, parsed.data.notes);
    revalidatePath("/admin/leads");
    return { success: true };
  } catch {
    return { error: "Lỗi khi cập nhật lead" };
  }
}
