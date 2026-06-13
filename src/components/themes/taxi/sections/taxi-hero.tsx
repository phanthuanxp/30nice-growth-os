import { Phone, MessageCircle } from "lucide-react";
import type { TaxiThemeConfig } from "../types";

interface Props {
  config: TaxiThemeConfig;
}

export function TaxiHero({ config }: Props) {
  const phoneHref = `tel:${config.phone.replace(/\s/g, "")}`;

  return (
    <section className="h-full rounded-3xl border border-teal-100 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 sm:text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Sẵn sàng đón xe — 24/7
        </div>

        <h1 className="mt-3 text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
          <span className="bg-gradient-to-r from-slate-900 via-teal-700 to-sky-700 bg-clip-text text-transparent">
            {config.heroTitle}
          </span>
        </h1>

        <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
          {config.heroSubtitle}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {["taxi bắc ninh", "taxi nội bài bắc ninh", "taxi bắc ninh hà nội", "xe riêng giá trọn gói"].map((label) => (
            <span key={label} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              {label}
            </span>
          ))}
        </div>

        <div className="relative mt-5 hidden h-56 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 md:block lg:h-64">
          <img
            src={config.heroImage || "/images/blog/tam-dao-thi-tran.webp"}
            alt="Taxi Bắc Ninh xe riêng giá trọn gói"
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/65 to-transparent px-4 py-3">
            <p className="text-xs font-semibold text-white sm:text-sm">
              Taxi Bắc Ninh hỗ trợ xe riêng, xe gia đình và xe đoàn 24/7.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
          <a
            href={phoneHref}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Phone className="h-4 w-4" />
            Gọi {config.phone}
          </a>
          <a
            href={config.zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <MessageCircle className="h-4 w-4" />
            Chat Zalo
          </a>
        </div>

        {/* Trust badges */}
        <ul className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          {config.benefits.map((item) => (
            <li key={item.title} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
              <span>{item.title}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="font-semibold text-yellow-500">★★★★★ {config.statsRating}/5</span>
          <span>{config.statsCount} lượt khách</span>
          <span>{config.statsYears} năm kinh nghiệm</span>
        </div>
      </div>
    </section>
  );
}
