import { TaxiHeader } from "./taxi-header";
import { TaxiFooter } from "./taxi-footer";
import { TaxiHero } from "./sections/taxi-hero";
import { TaxiBooking } from "./sections/taxi-booking";
import { TaxiFeatures } from "./sections/taxi-features";
import { TaxiServices } from "./sections/taxi-services";
import { TaxiPricing } from "./sections/taxi-pricing";
import { TaxiWhyChoose } from "./sections/taxi-why-choose";
import { TaxiTestimonials } from "./sections/taxi-testimonials";
import { TaxiFaq } from "./sections/taxi-faq";
import { TaxiCta } from "./sections/taxi-cta";
import { DEFAULT_TAXI_CONFIG } from "./types";
import type { TaxiThemeConfig } from "./types";

interface Props {
  siteName: string;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
  themeConfig?: Partial<TaxiThemeConfig> | null;
}

export function TaxiPage({ siteName, logoUrl, email, address, themeConfig }: Props) {
  const config: TaxiThemeConfig = {
    ...DEFAULT_TAXI_CONFIG,
    ...themeConfig,
  };

  return (
    <div className="min-h-screen bg-white">
      <TaxiHeader config={config} siteName={siteName} logoUrl={logoUrl} />

      <main>
        <TaxiHero config={config} />
        <TaxiBooking config={config} />
        <TaxiFeatures config={config} />
        <TaxiServices config={config} />
        <TaxiPricing config={config} />
        <TaxiWhyChoose config={config} />
        <TaxiTestimonials config={config} />
        <TaxiFaq config={config} />
        <TaxiCta config={config} />
      </main>

      <TaxiFooter config={config} siteName={siteName} logoUrl={logoUrl} email={email} address={address} />
    </div>
  );
}
