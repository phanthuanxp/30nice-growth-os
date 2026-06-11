import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { getTenantById } from "@/server/queries/tenants";

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

  return (
    <div>
      <PageHeader
        title="Menus"
        description={`Quản lý navigation menu của ${tenant.name}.`}
      />
      <Card className="p-12 text-center">
        <Navigation className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <h3 className="text-sm font-semibold text-slate-600 mb-1">Menu Builder</h3>
        <p className="text-xs text-slate-400">Tính năng này đang được phát triển.</p>
      </Card>
    </div>
  );
}
