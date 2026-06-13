import { prisma } from "@/server/db";
import type { TaxiNavItem } from "@/components/themes/taxi/types";

export async function getHeaderNavItems(tenantId: string): Promise<TaxiNavItem[] | null> {
  try {
    const menu = await prisma.menu.findFirst({
      where: { tenantId, location: "header" },
      include: { items: { orderBy: { order: "asc" } } },
    });
    if (!menu || menu.items.length === 0) return null;

    const roots = menu.items.filter((i) => !i.parentId);
    return roots.map((root) => {
      const children = menu.items
        .filter((i) => i.parentId === root.id)
        .map((c) => ({ label: c.label, href: c.href }));
      return children.length > 0
        ? { label: root.label, href: root.href, children }
        : { label: root.label, href: root.href };
    });
  } catch {
    return null;
  }
}
