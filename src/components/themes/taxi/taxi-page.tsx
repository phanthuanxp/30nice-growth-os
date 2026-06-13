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
import { TaxiPopup } from "./taxi-popup";
import { DEFAULT_TAXI_CONFIG } from "./types";
import type { TaxiSectionKey, TaxiThemeConfig } from "./types";

interface Props {
  siteName: string;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
  themeConfig?: Partial<TaxiThemeConfig> | null;
}

const DEFAULT_SECTION_ORDER = DEFAULT_TAXI_CONFIG.sectionOrder;

function normalizeSections(config: TaxiThemeConfig): TaxiSectionKey[] {
  const allowed = new Set<TaxiSectionKey>(DEFAULT_SECTION_ORDER);
  const seen = new Set<TaxiSectionKey>();
  const hidden = new Set<TaxiSectionKey>(config.hiddenSections ?? []);
  const ordered = (config.sectionOrder ?? DEFAULT_SECTION_ORDER)
    .filter((section): section is TaxiSectionKey => allowed.has(section as TaxiSectionKey))
    .filter((section) => {
      if (seen.has(section)) return false;
      seen.add(section);
      return !hidden.has(section);
    });

  for (const section of DEFAULT_SECTION_ORDER) {
    if (!seen.has(section) && !hidden.has(section)) ordered.push(section);
  }

  return ordered;
}

function renderTaxiSection(section: TaxiSectionKey, config: TaxiThemeConfig) {
  switch (section) {
    case "hero":
      return <TaxiHero key={section} config={config} />;
    case "booking":
      return <TaxiBooking key={section} config={config} />;
    case "features":
      return <TaxiFeatures key={section} config={config} />;
    case "services":
      return <TaxiServices key={section} config={config} />;
    case "pricing":
      return <TaxiPricing key={section} config={config} />;
    case "whyChoose":
      return <TaxiWhyChoose key={section} config={config} />;
    case "testimonials":
      return <TaxiTestimonials key={section} config={config} />;
    case "faq":
      return <TaxiFaq key={section} config={config} />;
    case "cta":
      return <TaxiCta key={section} config={config} />;
  }
}

export function TaxiPage({ siteName, logoUrl, email, address, themeConfig }: Props) {
  const config: TaxiThemeConfig = {
    ...DEFAULT_TAXI_CONFIG,
    ...themeConfig,
    sectionOrder: themeConfig?.sectionOrder ?? DEFAULT_TAXI_CONFIG.sectionOrder,
    hiddenSections: themeConfig?.hiddenSections ?? DEFAULT_TAXI_CONFIG.hiddenSections,
  };

  return (
    <div className="min-h-screen bg-white">
      <TaxiHeader config={config} siteName={siteName} logoUrl={logoUrl} />

      <main>{normalizeSections(config).map((section) => renderTaxiSection(section, config))}</main>

      <TaxiFooter config={config} siteName={siteName} logoUrl={logoUrl} email={email} address={address} />
      <TaxiPopup config={config} />
    </div>
  );
}
