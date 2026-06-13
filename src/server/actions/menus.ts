"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireTenantAccess } from "@/server/permissions/guard";

export type MenuActionState = { ok?: boolean; error?: string };

const LOCATIONS = ["header", "footer", "mobile"] as const;

const menuSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.enum(LOCATIONS),
});

const itemSchema = z.object({
  label: z.string().min(1).max(100),
  href: z.string().min(1).max(500),
  parentId: z.string().nullable().optional(),
});

export async function createMenuAction(
  tenantId: string,
  data: { name: string; location: string }
): Promise<MenuActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    const parsed = menuSchema.safeParse(data);
    if (!parsed.success) return { error: "Dữ liệu không hợp lệ" };

    // One menu per location per tenant — replace assignment if exists
    const existing = await prisma.menu.findFirst({
      where: { tenantId, location: parsed.data.location },
      select: { id: true },
    });
    if (existing) {
      return { error: `Đã có menu ở vị trí "${parsed.data.location}". Xóa menu cũ trước khi tạo mới.` };
    }

    await prisma.menu.create({
      data: { tenantId, name: parsed.data.name, location: parsed.data.location },
    });
    revalidatePath(`/admin/sites/${tenantId}/menus`);
    return { ok: true };
  } catch (err) {
    console.error("createMenuAction:", err);
    return { error: "Lỗi khi tạo menu" };
  }
}

export async function deleteMenuAction(tenantId: string, menuId: string): Promise<MenuActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    const menu = await prisma.menu.findUnique({ where: { id: menuId }, select: { tenantId: true } });
    if (!menu || menu.tenantId !== tenantId) return { error: "Menu không thuộc site này" };
    await prisma.menu.delete({ where: { id: menuId } });
    revalidatePath(`/admin/sites/${tenantId}/menus`);
    return { ok: true };
  } catch (err) {
    console.error("deleteMenuAction:", err);
    return { error: "Lỗi khi xóa menu" };
  }
}

export async function addMenuItemAction(
  tenantId: string,
  menuId: string,
  data: { label: string; href: string; parentId?: string | null }
): Promise<MenuActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    const parsed = itemSchema.safeParse(data);
    if (!parsed.success) return { error: "Dữ liệu không hợp lệ" };

    const menu = await prisma.menu.findUnique({ where: { id: menuId }, select: { tenantId: true } });
    if (!menu || menu.tenantId !== tenantId) return { error: "Menu không thuộc site này" };

    // Only 2 levels: a parent item must itself be root-level
    if (parsed.data.parentId) {
      const parent = await prisma.menuItem.findUnique({
        where: { id: parsed.data.parentId },
        select: { parentId: true, menuId: true },
      });
      if (!parent || parent.menuId !== menuId) return { error: "Mục cha không hợp lệ" };
      if (parent.parentId) return { error: "Chỉ hỗ trợ menu 2 cấp" };
    }

    const last = await prisma.menuItem.findFirst({
      where: { menuId, parentId: parsed.data.parentId ?? null },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    await prisma.menuItem.create({
      data: {
        menuId,
        label: parsed.data.label,
        href: parsed.data.href,
        parentId: parsed.data.parentId ?? null,
        order: (last?.order ?? -1) + 1,
      },
    });
    revalidatePath(`/admin/sites/${tenantId}/menus`);
    return { ok: true };
  } catch (err) {
    console.error("addMenuItemAction:", err);
    return { error: "Lỗi khi thêm mục menu" };
  }
}

export async function updateMenuItemAction(
  tenantId: string,
  itemId: string,
  data: { label: string; href: string }
): Promise<MenuActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    const parsed = itemSchema.pick({ label: true, href: true }).safeParse(data);
    if (!parsed.success) return { error: "Dữ liệu không hợp lệ" };

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: { menu: { select: { tenantId: true } } },
    });
    if (!item || item.menu.tenantId !== tenantId) return { error: "Mục menu không thuộc site này" };

    await prisma.menuItem.update({
      where: { id: itemId },
      data: { label: parsed.data.label, href: parsed.data.href },
    });
    revalidatePath(`/admin/sites/${tenantId}/menus`);
    return { ok: true };
  } catch (err) {
    console.error("updateMenuItemAction:", err);
    return { error: "Lỗi khi cập nhật mục menu" };
  }
}

export async function deleteMenuItemAction(tenantId: string, itemId: string): Promise<MenuActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    const owned = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: { menu: { select: { tenantId: true } } },
    });
    if (!owned || owned.menu.tenantId !== tenantId) return { error: "Mục menu không thuộc site này" };
    // Delete children first (2-level tree)
    await prisma.menuItem.deleteMany({ where: { parentId: itemId } });
    await prisma.menuItem.delete({ where: { id: itemId } });
    revalidatePath(`/admin/sites/${tenantId}/menus`);
    return { ok: true };
  } catch (err) {
    console.error("deleteMenuItemAction:", err);
    return { error: "Lỗi khi xóa mục menu" };
  }
}

export async function reorderMenuItemsAction(
  tenantId: string,
  orderedIds: string[]
): Promise<MenuActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.menuItem.update({ where: { id }, data: { order: index } })
      )
    );
    revalidatePath(`/admin/sites/${tenantId}/menus`);
    return { ok: true };
  } catch (err) {
    console.error("reorderMenuItemsAction:", err);
    return { error: "Lỗi khi sắp xếp menu" };
  }
}

export async function moveMenuItemAction(
  tenantId: string,
  itemId: string,
  direction: "up" | "down"
): Promise<MenuActionState> {
  try {
    await requireTenantAccess(tenantId, "EDITOR");
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: { menuId: true, parentId: true, order: true, menu: { select: { tenantId: true } } },
    });
    if (!item || item.menu.tenantId !== tenantId) return { error: "Không tìm thấy mục menu" };

    const siblings = await prisma.menuItem.findMany({
      where: { menuId: item.menuId, parentId: item.parentId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const idx = siblings.findIndex((s) => s.id === itemId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return { ok: true };

    const ids = siblings.map((s) => s.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];

    await prisma.$transaction(
      ids.map((id, index) => prisma.menuItem.update({ where: { id }, data: { order: index } }))
    );
    revalidatePath(`/admin/sites/${tenantId}/menus`);
    return { ok: true };
  } catch (err) {
    console.error("moveMenuItemAction:", err);
    return { error: "Lỗi khi di chuyển mục menu" };
  }
}
