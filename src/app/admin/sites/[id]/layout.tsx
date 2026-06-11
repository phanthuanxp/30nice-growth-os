import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getTenantById } from "@/server/queries/tenants";
import { SiteSidebar } from "@/components/admin/site-sidebar";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function SiteAdminLayout({ children, params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);

  if (!tenant) notFound();

  return (
    <div className="fixed inset-0 z-40 flex" style={{ background: "#f8fafc" }}>
      <SiteSidebar
        siteId={id}
        siteName={tenant.name}
        siteSlug={tenant.slug}
        primaryDomain={tenant.primaryDomain}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 gap-3">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <span>30Nice CMS</span>
            <span className="text-slate-300">/</span>
            <span>Sites</span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-800">{tenant.name}</span>
          </nav>
          {tenant.primaryDomain && (
            <a
              href={`https://${tenant.primaryDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Xem live site
            </a>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
