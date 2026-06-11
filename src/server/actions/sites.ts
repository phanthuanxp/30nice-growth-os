"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuth } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { prisma } from "@/server/db";
import { createTenant, updateTenant, deleteTenant } from "@/server/queries/tenants";

const siteSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "Chỉ dùng chữ thường, số, dấu gạch ngang"),
  primaryDomain: z.string().max(200).optional(),
  businessName: z.string().max(200).optional(),
  businessPhone: z.string().max(50).optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
  businessAddress: z.string().max(500).optional(),
  defaultSeoTitle: z.string().max(200).optional(),
  defaultSeoDescription: z.string().max(500).optional(),
  brandPrimary: z.string().max(20).optional(),
  brandSecondary: z.string().max(20).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).default("ACTIVE"),
});

export type SiteFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function getDefaultOrgId(): Promise<string> {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) throw new Error("No organization found. Run seed first.");
  return org.id;
}

export async function createSiteAction(
  _prev: SiteFormState,
  formData: FormData
): Promise<SiteFormState> {
  const user = await requireAuth();
  if (!can(user.role, "AGENCY_ADMIN")) return { error: "Không đủ quyền" };

  const raw = Object.fromEntries(formData);
  const parsed = siteSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const orgId = await getDefaultOrgId();
    const tenant = await createTenant(orgId, parsed.data);
    if (parsed.data.primaryDomain) {
      await prisma.domain.create({
        data: { tenantId: tenant.id, host: parsed.data.primaryDomain, primary: true, verified: false },
      });
    }
    revalidatePath("/admin/sites");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi không xác định";
    if (msg.includes("Unique constraint")) return { error: "Slug hoặc domain đã tồn tại" };
    return { error: msg };
  }
}

export async function updateSiteAction(
  id: string,
  _prev: SiteFormState,
  formData: FormData
): Promise<SiteFormState> {
  const user = await requireAuth();
  if (!can(user.role, "AGENCY_ADMIN")) return { error: "Không đủ quyền" };

  const raw = Object.fromEntries(formData);
  const parsed = siteSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await updateTenant(id, parsed.data);
    revalidatePath("/admin/sites");
    revalidatePath(`/admin/sites/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi cập nhật" };
  }
}

export async function deleteSiteAction(id: string): Promise<SiteFormState> {
  const user = await requireAuth();
  if (!can(user.role, "SUPER_ADMIN")) return { error: "Chỉ Super Admin mới được xóa site" };

  try {
    await deleteTenant(id);
    revalidatePath("/admin/sites");
    redirect("/admin/sites");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi khi xóa" };
  }
}
