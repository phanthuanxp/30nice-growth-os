import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SiteForm } from "@/components/admin/site-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { getTenantById } from "@/server/queries/tenants";
import { updateSiteAction, deleteSiteAction } from "@/server/actions/sites";
import { prisma } from "@/server/db";
import { DomainsClient, type DomainRow } from "./domains-client";

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

  const domains: DomainRow[] = await prisma.domain
    .findMany({
      where: { tenantId: id },
      orderBy: [{ primary: "desc" }, { createdAt: "asc" }],
      select: { id: true, host: true, verified: true, primary: true },
    })
    .catch(() => []);

  const updateAction = updateSiteAction.bind(null, id);
  const deleteAction = deleteSiteAction.bind(null, id);
  const serverIp = process.env.SERVER_PUBLIC_IP ?? "5.189.185.36";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt site"
        description="Thông tin và cấu hình cho site này."
        action={<DeleteButton onDelete={deleteAction} label="Xóa site" />}
      />

      <DomainsClient tenantId={id} domains={domains} serverIp={serverIp} />

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
