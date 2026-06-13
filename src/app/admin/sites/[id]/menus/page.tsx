import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getTenantById } from "@/server/queries/tenants";
import { prisma } from "@/server/db";
import { MenusClient, type MenuData } from "./menus-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Menus — ${tenant.name}` : "Menus" };
}

export default async function SiteMenusPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const rawMenus = await prisma.menu
    .findMany({
      where: { tenantId: id },
      include: { items: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    })
    .catch(() => []);

  const menus: MenuData[] = rawMenus.map((menu) => {
    const roots = menu.items.filter((i) => !i.parentId);
    return {
      id: menu.id,
      name: menu.name,
      location: menu.location,
      items: roots.map((root) => ({
        id: root.id,
        label: root.label,
        href: root.href,
        order: root.order,
        children: menu.items
          .filter((i) => i.parentId === root.id)
          .map((c) => ({ id: c.id, label: c.label, href: c.href, order: c.order })),
      })),
    };
  });

  return (
    <div>
      <PageHeader
        title="Menu Builder"
        description={`Quản lý navigation menu của ${tenant.name}. Menu Header sẽ tự động thay thế navigation của theme.`}
      />
      <MenusClient tenantId={id} menus={menus} />
    </div>
  );
}
