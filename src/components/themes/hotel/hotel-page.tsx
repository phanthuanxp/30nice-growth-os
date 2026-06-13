import { HotelHeader } from "./hotel-header";
import {
  HotelHero, HotelRooms, HotelAmenities, HotelGallery, HotelTestimonials, HotelLocation,
} from "./hotel-sections";
import { HotelBooking, HotelFooter } from "./hotel-booking";
import { DEFAULT_HOTEL_CONFIG } from "./types";
import type { HotelThemeConfig } from "./types";

interface Props {
  siteName: string;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
  themeConfig?: Partial<HotelThemeConfig> | null;
}

export function HotelPage({ siteName, logoUrl, email, address, themeConfig }: Props) {
  const config: HotelThemeConfig = {
    ...DEFAULT_HOTEL_CONFIG,
    ...themeConfig,
    copyrightName: themeConfig?.copyrightName ?? siteName,
  };

  return (
    <div className="min-h-screen bg-white">
      <HotelHeader config={config} siteName={siteName} logoUrl={logoUrl} />
      <main>
        <HotelHero config={config} />
        <HotelRooms config={config} />
        <HotelAmenities config={config} />
        <HotelGallery config={config} />
        <HotelTestimonials config={config} />
        <HotelLocation config={config} />
        <HotelBooking config={config} />
      </main>
      <HotelFooter config={config} siteName={siteName} logoUrl={logoUrl} email={email} address={address} />
    </div>
  );
}
