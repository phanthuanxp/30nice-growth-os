import { Phone, MessageCircle } from "lucide-react";
import type { TaxiThemeConfig } from "../types";

interface Props {
  config: TaxiThemeConfig;
}

export function TaxiHero({ config }: Props) {
  const phoneHref = `tel:${config.phone.replace(/\s/g, "")}`;

  return (
    <section
      className="relative min-h-[88vh] flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #1d4ed8 70%, #2563eb 100%)",
      }}
    >
      {/* Decorative overlay circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-white/3 -translate-y-1/2" />
      </div>

      {/* Hero image overlay if provided */}
      {config.heroImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${config.heroImage})`,
            opacity: 0.15,
          }}
        />
      )}

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center py-20 pt-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Sẵn sàng đón xe — 24/7
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
          {config.heroTitle}
        </h1>

        <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
          {config.heroSubtitle}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href={phoneHref}
            className="flex items-center gap-3 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-100 min-w-[220px] justify-center"
          >
            <Phone className="h-5 w-5" />
            Hotline: {config.phone}
          </a>
          <a
            href={config.zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-green-500/30 transition-all hover:scale-105 active:scale-100 min-w-[200px] justify-center"
          >
            <MessageCircle className="h-5 w-5" />
            Chat Zalo
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap gap-6 justify-center text-blue-100 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 text-base">★★★★★</span>
            <span>{config.statsRating}/5 đánh giá</span>
          </div>
          <div className="text-blue-200">·</div>
          <div>{config.statsCount} lượt khách</div>
          <div className="text-blue-200">·</div>
          <div>{config.statsYears} năm kinh nghiệm</div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 60L1440 60L1440 20C1440 20 1080 60 720 60C360 60 0 20 0 20L0 60Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
