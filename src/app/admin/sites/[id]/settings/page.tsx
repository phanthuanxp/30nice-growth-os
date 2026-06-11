import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SiteForm } from "@/components/admin/site-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { getTenantById } from "@/server/queries/tenants";
import { updateSiteAction, deleteSiteAction } from "@/server/actions/sites";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Cài đặt: ${tenant.name}` : "Cài đặt site" };
}

export default async function SiteSettingsPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);

  if (!tenant) notFound();

  const updateAction = updateSiteAction.bind(null, id);
  const deleteAction = deleteSiteAction.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt site"
        description="Thông tin và cấu hình cho site này."
        action={<DeleteButton onDelete={deleteAction} label="Xóa site" />}
      />
      <Card>
        <CardContent className="pt-6">
          <SiteForm
            action={updateAction}
            initialData={{
              name: tenant.name,
              slug: tenant.slug,
              primaryDomain: tenant.primaryDomain,
              businessName: tenant.businessName,
              businessPhone: tenant.businessPhone,
              businessEmail: tenant.businessEmail,
              businessAddress: tenant.businessAddress,
              defaultSeoTitle: tenant.defaultSeoTitle,
              defaultSeoDescription: tenant.defaultSeoDescription,
              brandPrimary: tenant.brandPrimary,
              brandSecondary: tenant.brandSecondary,
              status: tenant.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
