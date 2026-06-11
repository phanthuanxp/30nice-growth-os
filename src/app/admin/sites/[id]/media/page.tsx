import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getTenantById } from "@/server/queries/tenants";
import { SiteMediaClient } from "./media-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Media — ${tenant.name}` : "Media" };
}

export default async function SiteMediaPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description={`Quản lý hình ảnh và file của ${tenant.name}.`}
      />
      <SiteMediaClient tenantId={id} />
    </div>
  );
}
