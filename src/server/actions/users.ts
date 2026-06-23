"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { createUser, updateUser, deleteUser, getUserByEmail, getUserById } from "@/server/queries/users";
import { writeAuditLog } from "@/server/audit/log";

export type UserActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const ROLES = ["SUPER_ADMIN", "AGENCY_ADMIN", "TENANT_ADMIN", "EDITOR", "VIEWER"] as const;

const createSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  name: z.string().min(1, "Tên không được rỗng").max(200),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(200),
  role: z.enum(ROLES),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.enum(ROLES),
  password: z.string().min(8).max(200).optional().or(z.literal("")),
});

export async function createUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const user = await requireAuth();
  if (!can(user.role, "AGENCY_ADMIN")) return { error: "Không đủ quyền" };

  const raw = Object.fromEntries(formData);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  // SUPER_ADMIN can only be created by another SUPER_ADMIN
  if (parsed.data.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
    return { error: "Chỉ SUPER_ADMIN mới được tạo SUPER_ADMIN khác" };
  }

  const existing = await getUserByEmail(parsed.data.email);
  if (existing) return { error: "Email đã tồn tại" };

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const created = await createUser({
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash,
    });
    await writeAuditLog({
      userId: user.id,
      action: "user.create",
      resource: "User",
      resourceId: created.id,
      metadata: { email: created.email, role: created.role },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi tạo user" };
  }
}

export async function updateUserAction(
  id: string,
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!can(actor.role, "AGENCY_ADMIN")) return { error: "Không đủ quyền" };

  const target = await getUserById(id);
  if (!target) return { error: "User không tồn tại" };

  // Only SUPER_ADMIN can edit a SUPER_ADMIN
  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    return { error: "Chỉ SUPER_ADMIN mới được sửa SUPER_ADMIN" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  if (parsed.data.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    return { error: "Chỉ SUPER_ADMIN mới được gán role SUPER_ADMIN" };
  }

  try {
    const data: { name: string; role: typeof parsed.data.role; passwordHash?: string } = {
      name: parsed.data.name,
      role: parsed.data.role,
    };
    if (parsed.data.password && parsed.data.password.length >= 8) {
      data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }
    await updateUser(id, data);
    await writeAuditLog({
      userId: actor.id,
      action: "user.update",
      resource: "User",
      resourceId: id,
      metadata: {
        targetEmail: target.email,
        roleChange: target.role !== parsed.data.role ? { from: target.role, to: parsed.data.role } : undefined,
        passwordChanged: !!data.passwordHash,
      },
    });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi cập nhật user" };
  }
}

export async function deleteUserAction(id: string): Promise<UserActionState> {
  const actor = await requireAuth();
  if (actor.role !== "SUPER_ADMIN") return { error: "Chỉ SUPER_ADMIN mới được xoá user" };
  if (actor.id === id) return { error: "Không được tự xoá chính mình" };

  const target = await getUserById(id);
  if (!target) return { error: "User không tồn tại" };

  try {
    await deleteUser(id);
    await writeAuditLog({
      userId: actor.id,
      action: "user.delete",
      resource: "User",
      resourceId: id,
      metadata: { targetEmail: target.email, targetRole: target.role },
    });
    revalidatePath("/admin/users");
    redirect("/admin/users");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi xoá user" };
  }
}
