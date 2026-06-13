import { RestaurantHeader } from "./restaurant-header";
import {
  RestaurantHero, RestaurantAbout, RestaurantMenu, RestaurantGallery, RestaurantTestimonials,
} from "./restaurant-sections";
import { RestaurantReservation, RestaurantFooter } from "./restaurant-reservation";
import { DEFAULT_RESTAURANT_CONFIG } from "./types";
import type { RestaurantThemeConfig } from "./types";

interface Props {
  siteName: string;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
  themeConfig?: Partial<RestaurantThemeConfig> | null;
}

export function RestaurantPage({ siteName, logoUrl, email, address, themeConfig }: Props) {
  const config: RestaurantThemeConfig = {
    ...DEFAULT_RESTAURANT_CONFIG,
    ...themeConfig,
    copyrightName: themeConfig?.copyrightName ?? siteName,
  };

  return (
    <div className="min-h-screen bg-white">
      <RestaurantHeader config={config} siteName={siteName} logoUrl={logoUrl} />
      <main>
        <RestaurantHero config={config} />
        <RestaurantAbout config={config} />
        <RestaurantMenu config={config} />
        <RestaurantGallery config={config} />
        <RestaurantTestimonials config={config} />
        <RestaurantReservation config={config} />
      </main>
      <RestaurantFooter config={config} siteName={siteName} logoUrl={logoUrl} email={email} address={address} />
    </div>
  );
}
