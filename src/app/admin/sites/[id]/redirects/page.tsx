import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTenantById } from "@/server/queries/tenants";
import { listRedirects } from "@/server/queries/redirects";
import { SiteSidebar } from "@/components/admin/site-sidebar";
import { RedirectsClient } from "./redirects-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Redirect — ${tenant.name}` : "Redirect" };
}

export default async function RedirectsPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const redirects = await listRedirects(id).catch(() => []);

  return (
    <div className="flex flex-1 overflow-hidden">
      <SiteSidebar
        siteId={id}
        siteName={tenant.name}
        siteSlug={tenant.slug}
        primaryDomain={tenant.primaryDomain}
      />
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Quản lý redirect"
            description={`Quản lý URL redirects cho ${tenant.primaryDomain ?? tenant.slug}. Áp dụng ngay lập tức.`}
          />

          <RedirectsClient
            tenantId={id}
            initialRedirects={redirects.map((r) => ({
              ...r,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </div>
  );
}
