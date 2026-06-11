import { Phone, MessageCircle } from "lucide-react";
import type { TaxiThemeConfig } from "../types";

interface Props {
  config: TaxiThemeConfig;
}

export function TaxiCta({ config }: Props) {
  const phoneHref = `tel:${config.phone.replace(/\s/g, "")}`;

  return (
    <section
      className="py-20 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0369a1 100%)",
      }}
    >
      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider mb-3">
          {config.ctaSubtitle}
        </p>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          {config.ctaTitle}
        </h2>
        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          {config.ctaDescription}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={phoneHref}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-orange-500/40 transition-all hover:scale-105"
          >
            <Phone className="h-5 w-5" />
            Gọi {config.phone}
          </a>
          <a
            href={config.zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-8 py-4 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-lg rounded-2xl backdrop-blur-sm transition-all hover:scale-105"
          >
            <MessageCircle className="h-5 w-5" />
            Chat Zalo
          </a>
        </div>
      </div>
    </section>
  );
}
