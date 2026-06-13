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

  const sections = normalizeSections(config).filter((section) => section !== "hero" && section !== "booking");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <TaxiHeader config={config} siteName={siteName} logoUrl={logoUrl} />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pb-10 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-stretch">
          <TaxiHero config={config} />
          <TaxiBooking config={config} />
        </div>

        {sections.map((section) => renderTaxiSection(section, config))}
      </main>

      <TaxiFooter config={config} siteName={siteName} logoUrl={logoUrl} email={email} address={address} />
      <TaxiPopup config={config} />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.16)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <a
            href={`tel:${config.phone.replace(/\s/g, "")}`}
            className="rounded-lg bg-emerald-600 px-3 py-3 text-center text-sm font-bold text-white"
          >
            Gọi {config.phone}
          </a>
          <a
            href={config.zaloLink}
            className="rounded-lg bg-sky-600 px-3 py-3 text-center text-sm font-bold text-white"
          >
            Chat Zalo
          </a>
        </div>
      </div>
    </div>
  );
}
