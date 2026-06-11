import { THEME_REGISTRY } from "@/lib/theme-registry";
import { getTenants } from "@/server/queries/tenants";
import { prisma } from "@/server/db";
import { ThemeLibraryClient } from "./theme-library-client";

export default async function ThemeLibraryPage() {
  const [tenants, siteSettings] = await Promise.all([
    getTenants(),
    prisma.siteSettings.findMany({
      select: { tenantId: true, theme: true },
    }).catch(() => []),
  ]);

  const usageMap: Record<string, string[]> = {};
  for (const s of siteSettings) {
    if (s.theme) {
      usageMap[s.theme] = [...(usageMap[s.theme] ?? []), s.tenantId];
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Thư viện Giao diện</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Chọn theme và áp dụng cho site — không cần code
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          {THEME_REGISTRY.filter((t) => t.status === "available").length} theme sẵn sàng ·{" "}
          {THEME_REGISTRY.filter((t) => t.status === "coming-soon").length} sắp ra mắt
        </div>
      </div>

      <ThemeLibraryClient
        themes={THEME_REGISTRY}
        tenants={tenants.map((t) => ({ id: t.id, name: t.name, slug: t.slug, primaryDomain: t.primaryDomain }))}
        usageMap={usageMap}
      />
    </div>
  );
}
