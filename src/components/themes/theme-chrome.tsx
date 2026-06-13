import type { ReactNode } from "react";
import { getHeaderNavItems } from "@/server/queries/menus";
import type { TaxiThemeConfig } from "@/components/themes/taxi/types";
import type { RestaurantThemeConfig } from "@/components/themes/restaurant/types";
import type { HotelThemeConfig } from "@/components/themes/hotel/types";

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

/**
 * Wraps inner-page content (blog, uiBlocks pages) with the active theme's
 * header & footer so the whole site keeps one consistent shell.
 */
export async function ThemeChrome({ tenantId, tenantName, settings, children }: Props) {
  const theme = settings?.theme ?? "default";

  if (theme === "taxi") {
    const { TaxiHeader } = await import("@/components/themes/taxi/taxi-header");
    const { TaxiFooter } = await import("@/components/themes/taxi/taxi-footer");
    const { DEFAULT_TAXI_CONFIG } = await import("@/components/themes/taxi/types");
    const headerNav = await getHeaderNavItems(tenantId);
    const config = {
      ...DEFAULT_TAXI_CONFIG,
      ...(settings?.themeConfig as Partial<TaxiThemeConfig> | null),
      ...(headerNav ? { navItems: headerNav } : {}),
    };
    return (
      <div className="min-h-screen bg-white">
        <TaxiHeader config={config} siteName={tenantName} logoUrl={settings?.logoUrl} />
        <main className="pt-16">{children}</main>
        <TaxiFooter config={config} siteName={tenantName} logoUrl={settings?.logoUrl} email={settings?.email} address={settings?.address} />
      </div>
    );
  }

  if (theme === "restaurant") {
    const { RestaurantHeader } = await import("@/components/themes/restaurant/restaurant-header");
    const { RestaurantFooter } = await import("@/components/themes/restaurant/restaurant-reservation");
    const { DEFAULT_RESTAURANT_CONFIG } = await import("@/components/themes/restaurant/types");
    const headerNav = await getHeaderNavItems(tenantId);
    const config = {
      ...DEFAULT_RESTAURANT_CONFIG,
      ...(settings?.themeConfig as Partial<RestaurantThemeConfig> | null),
      ...(headerNav ? { navItems: headerNav.map((n) => ({ label: n.label, href: n.href })) } : {}),
    };
    return (
      <div className="min-h-screen bg-white">
        <RestaurantHeader config={config} siteName={tenantName} logoUrl={settings?.logoUrl} />
        <main className="pt-16">{children}</main>
        <RestaurantFooter config={config} siteName={tenantName} logoUrl={settings?.logoUrl} email={settings?.email} address={settings?.address} />
      </div>
    );
  }

  if (theme === "hotel") {
    const { HotelHeader } = await import("@/components/themes/hotel/hotel-header");
    const { HotelFooter } = await import("@/components/themes/hotel/hotel-booking");
    const { DEFAULT_HOTEL_CONFIG } = await import("@/components/themes/hotel/types");
    const headerNav = await getHeaderNavItems(tenantId);
    const config = {
      ...DEFAULT_HOTEL_CONFIG,
      ...(settings?.themeConfig as Partial<HotelThemeConfig> | null),
      ...(headerNav ? { navItems: headerNav.map((n) => ({ label: n.label, href: n.href })) } : {}),
    };
    return (
      <div className="min-h-screen bg-white">
        <HotelHeader config={config} siteName={tenantName} logoUrl={settings?.logoUrl} />
        <main className="pt-16">{children}</main>
        <HotelFooter config={config} siteName={tenantName} logoUrl={settings?.logoUrl} email={settings?.email} address={settings?.address} />
      </div>
    );
  }

  return <div className="min-h-screen bg-white">{children}</div>;
}
