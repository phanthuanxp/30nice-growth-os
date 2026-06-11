import { notFound } from "next/navigation";
import { getTenantById } from "@/server/queries/tenants";
import { SiteSidebar } from "@/components/admin/site-sidebar";
import { ThemeClient } from "./theme-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ThemePage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id);
  if (!tenant) notFound();

  const settings = tenant.settings;

  return (
    <div className="flex flex-1 overflow-hidden">
      <SiteSidebar
        siteId={id}
        siteName={tenant.name}
        siteSlug={tenant.slug}
        primaryDomain={tenant.primaryDomain}
      />
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Giao diện</h1>
            <p className="text-sm text-slate-500 mt-0.5">Chọn theme và tùy chỉnh nội dung trang web</p>
          </div>
          <ThemeClient
            siteId={id}
            currentTheme={settings?.theme ?? "default"}
            phone={settings?.phone ?? ""}
            zaloLink={(settings?.socialLinks as Record<string, string> | null)?.zalo ?? ""}
            themeConfig={settings?.themeConfig as Record<string, unknown> | null}
            primaryDomain={tenant.primaryDomain}
          />
        </div>
      </main>
    </div>
  );
}
