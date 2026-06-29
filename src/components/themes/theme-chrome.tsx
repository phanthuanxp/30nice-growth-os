import type { ReactNode } from "react";
import { getHeaderNavItems } from "@/server/queries/menus";
import type { TravelNewsThemeConfig } from "@/components/themes/travel-news/types";

interface SettingsLike {
  theme?: string | null;
  themeConfig?: unknown;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
}

interface Props {
  tenantId: string;
  tenantName: string;
  settings: SettingsLike | null;
  children: ReactNode;
}

export async function ThemeChrome({ tenantId, tenantName, settings, children }: Props) {
  const theme = settings?.theme ?? "default";

  if (theme === "travel-news") {
    const { TravelNewsHeader } = await import("@/components/themes/travel-news/travel-news-header");
    const { TravelNewsFooter } = await import("@/components/themes/travel-news/travel-news-footer");
    const { DEFAULT_TRAVEL_NEWS_CONFIG } = await import("@/components/themes/travel-news/types");
    const headerNav = await getHeaderNavItems(tenantId);
    const config: TravelNewsThemeConfig = {
      ...DEFAULT_TRAVEL_NEWS_CONFIG,
      ...(settings?.themeConfig as Partial<TravelNewsThemeConfig> | null),
      ...(headerNav ? { navItems: headerNav.map((n) => ({ label: n.label, href: n.href })) } : {}),
    };
    return (
      <div className="min-h-screen bg-slate-50">
        <TravelNewsHeader config={config} siteName={tenantName} logoUrl={settings?.logoUrl} />
        <main className="pt-[88px]">{children}</main>
        <TravelNewsFooter config={config} siteName={tenantName} logoUrl={settings?.logoUrl} email={settings?.email} address={settings?.address} />
      </div>
    );
  }

  return <div className="min-h-screen bg-white">{children}</div>;
}
