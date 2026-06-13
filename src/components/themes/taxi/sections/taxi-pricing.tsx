import { Car, Phone, Route } from "lucide-react";
import type { TaxiThemeConfig } from "../types";

interface Props {
  config: TaxiThemeConfig;
}

function priceLabel(value: string) {
  return value && value !== "Liên hệ" ? `${value}/chuyến` : "Liên hệ";
}

function routeImage(route: string) {
  const normalized = route.toLowerCase();
  if (normalized.includes("nội bài")) return "/images/blog/san-bay-noi-bai.webp";
  if (normalized.includes("hà nội")) return "/images/blog/duong-di-tam-dao.webp";
  return "/images/blog/tam-dao-thi-tran.webp";
}

export function TaxiPricing({ config }: Props) {
  return (
    <section id="bang-gia" className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl">
            <Route className="h-5 w-5 text-teal-700" />
            Tuyến phổ biến / Bảng giá tham khảo
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{config.pricingNote}</p>
        </div>
        <a
          href={`tel:${config.phone.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          <Phone className="h-4 w-4" />
          Gọi để chốt giá trọn gói
        </a>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {config.pricing.map((row) => (
          <article
            key={row.route}
            className={`rounded-xl border p-4 ${
              row.badge ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="inline-flex items-center gap-1.5 text-base font-bold text-slate-900 sm:text-xl">
                <Car className="h-4 w-4 text-teal-700" />
                {row.route}
              </h3>
              {row.badge ? (
                <span className="rounded-full bg-teal-700 px-2 py-1 text-xs font-semibold text-white">
                  {row.badge}
                </span>
              ) : null}
            </div>

            <img
              src={routeImage(row.route)}
              alt={`Ảnh tuyến ${row.route}`}
              loading="lazy"
              decoding="async"
              className="mt-3 h-32 w-full rounded-lg border border-slate-200 object-cover sm:h-36"
            />

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["Xe 4 chỗ", row.xe4],
                ["Xe 7 chỗ", row.xe7],
                ["Xe 16 chỗ", row.xe16],
              ].map(([label, price]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center">
                  <p className="text-xs font-semibold text-slate-700">{label}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-tight text-teal-800 sm:text-xs">
                    {priceLabel(price)}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
        * Giá có thể thay đổi theo thực tế lộ trình và thời điểm. Gọi hotline để nhận báo giá chính xác.
      </p>
    </section>
  );
}
