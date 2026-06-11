import { notFound } from "next/navigation";
import { getTenantById } from "@/server/queries/tenants";
import { SiteSidebar } from "@/components/admin/site-sidebar";
import { FormsClient } from "./forms-client";
import { getFormConfig } from "./actions";
import { prisma } from "@/server/db";
import type { NotificationConfig } from "@/lib/notifications";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FormsPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id);
  if (!tenant) notFound();

  const [config, recentLeads] = await Promise.all([
    getFormConfig(id),
    prisma.lead.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, phone: true, message: true, status: true, createdAt: true, sourcePath: true },
    }).catch(() => []),
  ]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <SiteSidebar siteId={id} siteName={tenant.name} siteSlug={tenant.slug} primaryDomain={tenant.primaryDomain} />
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-slate-900">Forms & Thông báo Lead</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Cấu hình nhận thông báo khi có khách điền form đặt xe / liên hệ
            </p>
          </div>
          <FormsClient
            siteId={id}
            config={config as NotificationConfig | null}
            recentLeads={recentLeads.map(l => ({
              ...l,
              createdAt: l.createdAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </div>
  );
}
