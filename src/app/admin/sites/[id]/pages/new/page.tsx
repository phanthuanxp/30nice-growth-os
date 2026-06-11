import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PageForm } from "@/components/admin/page-form";
import { getTenantById } from "@/server/queries/tenants";
import { createPageAction } from "@/server/actions/pages";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Tạo Page Mới" };

export default async function SiteNewPagePage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  return (
    <div>
      <PageHeader
        title="Tạo Page Mới"
        description={`Tạo trang nội dung mới cho ${tenant.name}.`}
      />
      <Card>
        <CardContent className="pt-6">
          <PageForm
            action={createPageAction}
            tenants={[{ id: tenant.id, name: tenant.name }]}
            initialData={{ tenantId: tenant.id }}
            isNew
            returnTo={`/admin/sites/${id}/pages`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
