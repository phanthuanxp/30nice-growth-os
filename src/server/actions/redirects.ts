"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";
import {
  createRedirect,
  updateRedirect,
  deleteRedirect,
  toggleRedirect,
} from "@/server/queries/redirects";

export type ActionResult = { ok: boolean; error?: string };

async function requireEditor(tenantId: string) {
  const session = await getSession();
  if (!session) return { session: null, error: "Chưa đăng nhập" as const };
  if (!can(session.role, "EDITOR")) return { session: null, error: "Không có quyền" as const };
  return { session, error: null };
}

export async function createRedirectAction(
  tenantId: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { session, error } = await requireEditor(tenantId);
  if (!session) return { ok: false, error };

  const fromPath = form.get("fromPath")?.toString().trim();
  const toPath = form.get("toPath")?.toString().trim();
  const statusCode = parseInt(form.get("statusCode")?.toString() ?? "301", 10);
  const note = form.get("note")?.toString().trim();

  if (!fromPath) return { ok: false, error: "From path là bắt buộc" };
  if (!toPath) return { ok: false, error: "To path là bắt buộc" };

  try {
    const rule = await createRedirect(tenantId, { fromPath, toPath, statusCode, note });
    await writeAuditLog({
      userId: session.id,
      action: "redirect.create",
      resource: "RedirectRule",
      resourceId: rule.id,
      tenantId,
    });
    revalidatePath(`/admin/sites/${tenantId}/redirects`);
    return { ok: true };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return { ok: false, error: "From path này đã có redirect rồi" };
    }
    return { ok: false, error: "Không thể tạo redirect" };
  }
}

export async function updateRedirectAction(
  id: string,
  tenantId: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { session, error } = await requireEditor(tenantId);
  if (!session) return { ok: false, error };

  const fromPath = form.get("fromPath")?.toString().trim();
  const toPath = form.get("toPath")?.toString().trim();
  const statusCode = parseInt(form.get("statusCode")?.toString() ?? "301", 10);
  const note = form.get("note")?.toString().trim();

  if (!fromPath) return { ok: false, error: "From path là bắt buộc" };
  if (!toPath) return { ok: false, error: "To path là bắt buộc" };

  try {
    await updateRedirect(id, tenantId, { fromPath, toPath, statusCode, note });
    await writeAuditLog({
      userId: session.id,
      action: "redirect.update",
      resource: "RedirectRule",
      resourceId: id,
      tenantId,
    });
    revalidatePath(`/admin/sites/${tenantId}/redirects`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không thể cập nhật redirect" };
  }
}

export async function deleteRedirectAction(id: string, tenantId: string): Promise<ActionResult> {
  const { session, error } = await requireEditor(tenantId);
  if (!session) return { ok: false, error };

  try {
    await deleteRedirect(id, tenantId);
    await writeAuditLog({
      userId: session.id,
      action: "redirect.delete",
      resource: "RedirectRule",
      resourceId: id,
      tenantId,
    });
    revalidatePath(`/admin/sites/${tenantId}/redirects`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không thể xóa redirect" };
  }
}

export async function toggleRedirectAction(
  id: string,
  tenantId: string,
  active: boolean,
): Promise<ActionResult> {
  const { session, error } = await requireEditor(tenantId);
  if (!session) return { ok: false, error };

  try {
    await toggleRedirect(id, tenantId, active);
    revalidatePath(`/admin/sites/${tenantId}/redirects`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không thể cập nhật trạng thái" };
  }
}
